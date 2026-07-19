import json
import os
from typing import List, Dict, Any

class ChunkerService:
    @staticmethod
    def chunk_file(file_path: str) -> List[Dict[str, Any]]:
        """Parses legal JSON files and builds chunks comparison maps."""
        filename = os.path.basename(file_path)
        
        # Set old vs new law comparison variables based on filename
        if "iea" in filename.lower():
            old_law_label = "IEA"
            new_law_label = "BSA"
            old_key = "iea_section"
            new_key = "bsa_section"
            source_name = "BSA vs IEA (Evidence)"
        elif "crpc" in filename.lower() or "bnss" in filename.lower():
            old_law_label = "CrPC"
            new_law_label = "BNSS"
            old_key = "crpc_section"
            new_key = "bnss_section"
            source_name = "BNSS vs CrPC (Procedure)"
        else:
            old_law_label = "IPC"
            new_law_label = "BNS"
            old_key = "ipc_section"
            new_key = "bns_section"
            source_name = "BNS vs IPC (Penal)"

        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        chunks = []
        for idx, entry in enumerate(data):
            old_sec = entry.get(old_key, "N/A")
            new_sec = entry.get(new_key, "N/A")
            subject = entry.get("subject", "N/A").strip()
            summary = entry.get("summary", "No summary available.").strip()
            extra_data = entry.get("extra_data", "").strip()
            
            # Construct standard comparative format
            content_template = (
                f"Subject: {subject}\n"
                f"Old Law ({old_law_label}): Section {old_sec}\n"
                f"New Law ({new_law_label}): Section {new_sec}\n"
                f"Summary of Change: {summary}\n"
            )
            if extra_data:
                content_template += f"Full Legal Text:\n{extra_data}"
            
            max_chars = 8000
            overlap = 200
            
            if len(content_template) <= max_chars:
                text_splits = [content_template]
            else:
                # Split at paragraph boundaries if length exceeds max_chars
                paragraphs = content_template.split("\n\n")
                text_splits = []
                current_chunk = []
                current_len = 0
                for para in paragraphs:
                    if current_len + len(para) > max_chars and current_chunk:
                        text_splits.append("\n\n".join(current_chunk))
                        overlap_chunk = []
                        overlap_len = 0
                        for p in reversed(current_chunk):
                            if overlap_len + len(p) < overlap:
                                overlap_chunk.insert(0, p)
                                overlap_len += len(p) + 2
                            else:
                                break
                        current_chunk = overlap_chunk
                        current_len = overlap_len
                    
                    current_chunk.append(para)
                    current_len += len(para) + 2
                if current_chunk:
                    text_splits.append("\n\n".join(current_chunk))
            
            for split_idx, text_content in enumerate(text_splits):
                chunks.append({
                    "content": text_content,
                    "source_name": source_name,
                    "source_type": "bare_act",
                    "section": f"{new_law_label} {new_sec} / {old_law_label} {old_sec}",
                    "metadata": {
                        "old_section": old_sec,
                        "new_section": new_sec,
                        "subject": subject,
                        "summary": summary,
                        "source_file": filename,
                        "chunk_index": idx,
                        "split_index": split_idx
                    }
                })
                
        return chunks
