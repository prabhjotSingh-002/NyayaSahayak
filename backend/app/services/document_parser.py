import io
import os
import fitz  # PyMuPDF
import cv2
import numpy as np
from typing import Dict, Any, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed
from PIL import Image
import pytesseract
from google import genai as google_genai
from google.genai import types
from app.config import settings
from app.models.database import supabase


def process_single_page(page_num: int, file_path: str) -> tuple:
    """Worker function to render a PDF page and run OCR (Tesseract -> Gemini fallback)."""
    try:
        doc = fitz.open(file_path)
        page = doc.load_page(page_num)
        
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
        image_bytes = pix.tobytes("png")
        doc.close()
        
        # Preprocessing using cv2 (Deskew, Denoise, CLAHE, Binarize)
        try:
            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            denoised = cv2.fastNlMeansDenoising(gray, h=10)
            
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            cl = clahe.apply(denoised)
            
            thresh = cv2.threshold(cl, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1]
            coords = np.column_stack(np.where(thresh > 0))
            if len(coords) > 0:
                angle = cv2.minAreaRect(coords)[-1]
                if angle < -45:
                    angle = -(90 + angle)
                elif angle > 45:
                    angle = 90 - angle
                
                if 0.1 <= abs(angle) <= 45:
                    (h, w) = cl.shape[:2]
                    center = (w // 2, h // 2)
                    M = cv2.getRotationMatrix2D(center, angle, 1.0)
                    cl = cv2.warpAffine(cl, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
            
            final_thresh = cv2.threshold(cl, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
            processed_img = Image.fromarray(final_thresh)
        except Exception as prep_err:
            print(f"[DocumentParser] Preprocessing failed on page {page_num}: {prep_err}. Using fallback.")
            processed_img = Image.open(io.BytesIO(image_bytes))
        
        ocr_text = None
        try:
            # Check Tesseract OCR average confidence
            data = pytesseract.image_to_data(processed_img, output_type=pytesseract.Output.DICT)
            confidences = [int(c) for c in data['conf'] if c != '-1']
            avg_conf = sum(confidences) / len(confidences) if confidences else 0.0
            
            if avg_conf >= 75:
                ocr_text = pytesseract.image_to_string(processed_img).strip()
                print(f"[DocumentParser] Page {page_num + 1}: Tesseract succeeded with {avg_conf:.1f}% confidence.")
        except Exception as tess_err:
            print(f"[DocumentParser] Tesseract failed on page {page_num}: {tess_err}")
        
        # OCR fallback models ordered by performance and rate limits
        OCR_FALLBACK_CHAIN = [
            "gemini-3.1-flash-lite",
            "gemini-flash-lite-latest",
            "gemini-flash-latest",
            "gemini-3.5-flash",
        ]

        if not ocr_text:
            client = None
            if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY not in ('', 'AIza...'):
                try:
                    client = google_genai.Client(api_key=settings.GEMINI_API_KEY)
                except Exception as init_err:
                    print(f"[DocumentParser] Failed to initialize Gemini Client for page {page_num}: {init_err}")

            if client:
                buf = io.BytesIO()
                processed_img.save(buf, format="PNG")
                processed_bytes = buf.getvalue()

                for model_name in OCR_FALLBACK_CHAIN:
                    try:
                        print(f"[DocumentParser] Page {page_num + 1}: Trying Gemini OCR via [{model_name}]...")
                        response = client.models.generate_content(
                            model=model_name,
                            contents=[
                                types.Part.from_bytes(
                                    data=processed_bytes,
                                    mime_type='image/png',
                                ),
                                "Extract all text from this document image. Preserve formatting."
                            ]
                        )
                        if response.text:
                            ocr_text = response.text.strip()
                            print(f"[DocumentParser] Page {page_num + 1}: OCR succeeded via [{model_name}].")
                            break
                    except Exception as model_err:
                        err_str = str(model_err)
                        if "429" in err_str or "quota" in err_str.lower() or "rate" in err_str.lower():
                            print(f"[DocumentParser] [{model_name}] rate limited on page {page_num + 1}. Trying next model...")
                            continue
                        print(f"[DocumentParser] [{model_name}] failed on page {page_num + 1}: {model_err}. Trying next model...")
                        continue
        
        return page_num, ocr_text or "[Scanned Page — No Text Extracted]"
    except Exception as page_err:
        print(f"[DocumentParser] Fatal page error on page {page_num}: {page_err}")
        return page_num, f"[Error processing page {page_num + 1}]"


class DocumentParser:
    @staticmethod
    def extract_text_from_pdf(file_path: str, doc_id: Optional[str] = None) -> Dict[str, Any]:
        """Extracts text from a PDF file using digital extraction or parallel page-by-page OCR."""
        try:
            doc = fitz.open(file_path)
            page_count = len(doc)
            
            # Step A: Try digital text extraction
            digital_texts = []
            for page_num in range(page_count):
                page = doc.load_page(page_num)
                digital_texts.append(page.get_text("text").strip())
            
            full_digital_text = "\n\n--- PAGE BREAK ---\n\n".join(digital_texts)
            
            # Return immediately if digital text is meaningful
            if len(full_digital_text.replace("\n", "").replace(" ", "").strip()) >= 100:
                doc.close()
                if doc_id:
                    try:
                        supabase.table("documents").update({
                            "extracted_text": full_digital_text,
                            "page_count": page_count
                        }).eq("id", doc_id).execute()
                    except Exception as db_err:
                        print(f"[DocumentParser] Error updating doc {doc_id}: {db_err}")
                return {
                    "success": True,
                    "text": full_digital_text,
                    "metadata": {
                        "page_count": page_count,
                        "scanned_pages": 0,
                        "format": "PDF (Digital)"
                    }
                }
            
            doc.close()
            
            # Step B: Run parallel OCR for scanned PDFs
            print(f"[DocumentParser] PDF ({file_path}) is scanned. Running parallel OCR...")
            results = [None] * page_count
            
            with ThreadPoolExecutor(max_workers=4) as executor:
                futures = {executor.submit(process_single_page, page_num, file_path): page_num for page_num in range(page_count)}
                
                for future in as_completed(futures):
                    page_num, text = future.result()
                    results[page_num] = text
                    
                    # Update database progressively with current extracted text
                    if doc_id:
                        display_text_list = []
                        for i in range(page_count):
                            if results[i] is not None:
                                display_text_list.append(results[i])
                            else:
                                display_text_list.append(f"[Processing page {i+1}...]")
                        current_full_text = "\n\n--- PAGE BREAK ---\n\n".join(display_text_list)
                        
                        try:
                            supabase.table("documents").update({
                                "extracted_text": current_full_text,
                                "page_count": page_count
                            }).eq("id", doc_id).execute()
                        except Exception as db_err:
                            print(f"[DocumentParser] Error updating doc {doc_id} on page {page_num}: {db_err}")
            
            final_text = "\n\n--- PAGE BREAK ---\n\n".join(results)
            return {
                "success": True,
                "text": final_text,
                "metadata": {
                    "page_count": page_count,
                    "scanned_pages": page_count,
                    "format": "PDF (Scanned OCR - Parallel)"
                }
            }
            
        except Exception as e:
            print(f"[DocumentParser] PDF processing error: {e}")
            return {
                "success": False,
                "error": str(e)
            }
