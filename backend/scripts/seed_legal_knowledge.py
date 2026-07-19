#!/usr/bin/env python3
"""
RAG Data Seeder — NyayaSahayak
Uses the ChunkerService to parse raw data, Gemini Embedding API (gemini-embedding-2)
to get 768-dim vectors in batch requests, and seeds them into Supabase.

Usage:
  cd backend
  # Clear and seed only iea_and_bsa.txt
  .\venv\Scripts\python.exe scripts\seed_legal_knowledge.py --clear --file iea_and_bsa.txt

  # Show status
  .\venv\Scripts\python.exe scripts\seed_legal_knowledge.py --status
"""

import sys
import os
import asyncio
import argparse

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models.database import supabase
from app.services.embedding import EmbeddingService
from app.services.chunker import ChunkerService

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data")

async def get_completed_chunks(source_file: str) -> set:
    """Fetch set of completed chunk indices from database."""
    try:
        res = supabase.table("seeding_log").select("chunk_index").eq("source_file", source_file).execute()
        return {r["chunk_index"] for r in res.data}
    except Exception as e:
        print(f"Warning: Could not fetch seeding log for {source_file} (migration might not be applied yet): {e}")
        return set()

async def clear_database():
    """Clear all records from legal_knowledge and seeding_log tables to start fresh."""
    print("\n[CLEAR] Clearing legal_knowledge and seeding_log tables...")
    try:
        # Use a non-matching UUID query to delete all records (since Supabase requires a filter)
        supabase.table("legal_knowledge").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        supabase.table("seeding_log").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        print("[CLEAR] Database cleared successfully!")
    except Exception as e:
        print(f"[CLEAR] Error clearing database: {e}")

async def seed_file(filename: str):
    """Seed a single file with batch embedding and resume mechanism."""
    file_path = os.path.join(DATA_DIR, filename)
    if not os.path.exists(file_path):
        print(f"Error: File not found at {file_path}")
        return

    print(f"\nProcessing {filename}...")
    chunks = ChunkerService.chunk_file(file_path)
    print(f"Generated {len(chunks)} chunks from {filename}.")

    completed_indices = await get_completed_chunks(filename)
    print(f"Already completed: {len(completed_indices)}/{len(chunks)} chunks.")

    to_process = [c for c in chunks if c["metadata"]["chunk_index"] not in completed_indices]
    if not to_process:
        print(f"All chunks for {filename} are already seeded!")
        return

    print(f"Seeding {len(to_process)} remaining chunks...")

    # Extract all texts to embed
    texts_to_embed = [c["content"] for c in to_process]
    
    # Get all embeddings in parallel batches of 50
    print(f"Embedding {len(texts_to_embed)} chunks in parallel batches using {EmbeddingService.EMBEDDING_DIM}-dim model...")
    embeddings = await EmbeddingService.embed_texts(texts_to_embed)
    print(f"Retrieved {len(embeddings)} embeddings successfully.")

    # Insert chunks sequentially into database
    success_count = 0
    for i, chunk in enumerate(to_process):
        idx = chunk["metadata"]["chunk_index"]
        content = chunk["content"]
        chunk_hash = EmbeddingService.compute_chunk_hash(content)
        embedding = embeddings[i]
        
        # Skip failed zero-vector embeddings
        if all(v == 0.0 for v in embedding):
            print(f"  Warning: Skipping chunk index {idx} due to embedding failure.")
            continue
        
        try:
            # Insert legal knowledge
            supabase.table("legal_knowledge").insert({
                "content": content,
                "embedding": embedding,
                "source_type": chunk["source_type"],
                "source_name": chunk["source_name"],
                "section": chunk["section"],
                "metadata": chunk["metadata"]
            }).execute()
            
            # Log seeding progress
            supabase.table("seeding_log").insert({
                "source_file": filename,
                "chunk_index": idx,
                "chunk_hash": chunk_hash,
                "status": "completed",
                "tokens_used": len(content) // 4
            }).execute()
            
            success_count += 1
            if (i + 1) % 20 == 0 or (i + 1) == len(to_process):
                print(f"  Progress: {i + 1}/{len(to_process)} successfully seeded.")
        except Exception as e:
            print(f"  Error seeding chunk index {idx}: {e}")

    print(f"Seeding finished for {filename}. Successfully seeded {success_count} chunks.")

async def show_status():
    """Show current seeding progress."""
    files = ["iea_and_bsa.txt", "bns_and_ipc.txt", "crpc_and_bnss.txt"]
    print("\nNyayaSahayak Seeding Progress Status:")
    print("=" * 60)
    for f in files:
        file_path = os.path.join(DATA_DIR, f)
        if os.path.exists(file_path):
            try:
                chunks = ChunkerService.chunk_file(file_path)
                total = len(chunks)
            except Exception:
                total = 0
            
            try:
                res = supabase.table("seeding_log").select("count", count="exact").eq("source_file", f).execute()
                seeded = res.count if res.count is not None else len(res.data)
            except Exception:
                seeded = 0
                
            percent = (seeded / total * 100) if total > 0 else 0
            print(f"  {f:<20} : {seeded:>5} / {total:<5} ({percent:.1f}%)")
        else:
            print(f"  {f:<20} : File not found locally")
    
    # Also count total rows in legal_knowledge
    try:
        res = supabase.table("legal_knowledge").select("count", count="exact").execute()
        total_rows = res.count if res.count is not None else len(res.data)
        print("-" * 60)
        print(f"  Total records in legal_knowledge table: {total_rows}")
    except Exception as e:
        print(f"  Could not read legal_knowledge row count: {e}")
    print("=" * 60)

async def main():
    parser = argparse.ArgumentParser(description="NyayaSahayak Legal Knowledge Seeder")
    parser.add_argument("--clear", action="store_true", help="Clear database tables before executing seeding")
    
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--file", help="Seed a specific file (e.g. iea_and_bsa.txt)")
    group.add_argument("--all", action="store_true", help="Seed all data files sequentially")
    group.add_argument("--status", action="store_true", help="Show current seeding status")
    
    args = parser.parse_args()
    
    if args.clear:
        await clear_database()
        
    if args.status:
        await show_status()
    elif args.file:
        await seed_file(args.file)
    elif args.all:
        files = ["iea_and_bsa.txt", "bns_and_ipc.txt", "crpc_and_bnss.txt"]
        for f in files:
            await seed_file(f)

if __name__ == "__main__":
    asyncio.run(main())
