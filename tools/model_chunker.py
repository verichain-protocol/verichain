#!/usr/bin/env python3
"""
VeriChain Model Chunker
Utility to chunk large ONNX models for ICP deployment
"""

import os
import sys
import json
import hashlib
import argparse
from pathlib import Path

# Configuration
DEFAULT_CHUNK_SIZE_MB = 0.8  # ICP-compatible chunk size (800KB safe for 2MB limit)
MAX_CHUNK_SIZE_MB = 1.0      # Maximum safe chunk size for ICP

def calculate_sha256(file_path):
    """Calculate SHA256 hash of a file"""
    hash_sha256 = hashlib.sha256()
    file_size = os.path.getsize(file_path)
    processed = 0
    
    with open(file_path, "rb") as f:
        while True:
            chunk = f.read(8192)
            if not chunk:
                break
            hash_sha256.update(chunk)
            processed += len(chunk)
            
            # Show progress for large files
            if file_size > 50 * 1024 * 1024:
                progress = (processed / file_size) * 100
                print(f"\rCalculating hash... {progress:.1f}%", end='', flush=True)
    
    if file_size > 50 * 1024 * 1024:
        print()
    
    return hash_sha256.hexdigest()

def format_file_size(size_bytes):
    """Format file size in human readable format"""
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    elif size_bytes < 1024 * 1024 * 1024:
        return f"{size_bytes / (1024 * 1024):.1f} MB"
    else:
        return f"{size_bytes / (1024 * 1024 * 1024):.1f} GB"

def chunk_model(input_file, output_dir, chunk_size_mb=DEFAULT_CHUNK_SIZE_MB):
    """
    Chunk a large model file into smaller pieces suitable for ICP
    
    Args:
        input_file: Path to the input model file
        output_dir: Directory to save chunks
        chunk_size_mb: Size of each chunk in MB (default: 15MB for ICP)
    
    Returns:
        dict: Metadata about the chunked model
    """
    input_path = Path(input_file)
    output_path = Path(output_dir)
    
    # Validate input
    if not input_path.exists():
        raise FileNotFoundError(f"Input file not found: {input_file}")
    
    if not input_path.is_file():
        raise ValueError(f"Input path is not a file: {input_file}")
    
    # Validate chunk size
    if chunk_size_mb > MAX_CHUNK_SIZE_MB:
        print(f"⚠️  Warning: Chunk size {chunk_size_mb}MB exceeds recommended maximum {MAX_CHUNK_SIZE_MB}MB for ICP")
    
    # Create output directory
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Calculate chunk size in bytes
    chunk_size = int(chunk_size_mb * 1024 * 1024)
    
    # Get file info
    file_size = input_path.stat().st_size
    total_chunks = (file_size + chunk_size - 1) // chunk_size  # Ceiling division
    
    print(f"📦 Chunking model: {input_path.name}")
    print(f"📊 File size: {format_file_size(file_size)}")
    print(f"🔢 Chunk size: {chunk_size_mb} MB")
    print(f"📈 Total chunks: {total_chunks}")
    print()
    
    chunks_info = []
    chunk_id = 0
    
    with open(input_path, 'rb') as infile:
        while True:
            chunk_data = infile.read(chunk_size)
            if not chunk_data:
                break
            
            # Write chunk
            chunk_filename = f"model_chunk_{chunk_id:03d}.bin"
            chunk_path = output_path / chunk_filename
            
            with open(chunk_path, 'wb') as chunk_file:
                chunk_file.write(chunk_data)
            
            # Calculate hash
            chunk_hash = calculate_sha256(chunk_path)
            
            # Store chunk info
            chunk_info = {
                "chunk_id": chunk_id,
                "filename": chunk_filename,
                "size": len(chunk_data),
                "hash": chunk_hash
            }
            chunks_info.append(chunk_info)
            
            print(f"Created {chunk_filename} ({len(chunk_data)} bytes)")
            chunk_id += 1
    
    # Create metadata
    metadata = {
        "original_file": str(input_path.name),
        "original_size": file_size,
        "total_chunks": len(chunks_info),
        "chunk_size_mb": chunk_size_mb,
        "chunks": chunks_info
    }
    
    # Save metadata
    metadata_path = output_path / "model_metadata.json"
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print(f"\nChunking complete!")
    print(f"Total chunks: {len(chunks_info)}")
    print(f"Metadata saved to: {metadata_path}")
    
    return metadata

def verify_chunks(chunks_dir):
    """Verify chunk integrity using metadata"""
    chunks_path = Path(chunks_dir)
    metadata_path = chunks_path / "model_metadata.json"
    
    if not metadata_path.exists():
        print("Error: model_metadata.json not found")
        return False
    
    with open(metadata_path, 'r') as f:
        metadata = json.load(f)
    
    print(f"Verifying {metadata['total_chunks']} chunks...")
    
    all_valid = True
    for chunk_info in metadata['chunks']:
        chunk_path = chunks_path / chunk_info['filename']
        
        if not chunk_path.exists():
            print(f"❌ Missing: {chunk_info['filename']}")
            all_valid = False
            continue
        
        # Check size
        actual_size = chunk_path.stat().st_size
        if actual_size != chunk_info['size']:
            print(f"❌ Size mismatch: {chunk_info['filename']} "
                  f"(expected {chunk_info['size']}, got {actual_size})")
            all_valid = False
            continue
        
        # Check hash
        actual_hash = calculate_sha256(chunk_path)
        if actual_hash != chunk_info['hash']:
            print(f"❌ Hash mismatch: {chunk_info['filename']}")
            all_valid = False
            continue
        
        print(f"✅ {chunk_info['filename']}")
    
    if all_valid:
        print("\n🎉 All chunks verified successfully!")
    else:
        print("\n❌ Some chunks failed verification!")
    
    return all_valid

def reconstruct_model(chunks_dir, output_file):
    """Reconstruct model from chunks"""
    chunks_path = Path(chunks_dir)
    metadata_path = chunks_path / "model_metadata.json"
    
    if not metadata_path.exists():
        print("Error: model_metadata.json not found")
        return False
    
    with open(metadata_path, 'r') as f:
        metadata = json.load(f)
    
    print(f"Reconstructing model from {metadata['total_chunks']} chunks...")
    
    with open(output_file, 'wb') as outfile:
        for chunk_info in metadata['chunks']:
            chunk_path = chunks_path / chunk_info['filename']
            
            if not chunk_path.exists():
                print(f"Error: Missing chunk {chunk_info['filename']}")
                return False
            
            with open(chunk_path, 'rb') as chunk_file:
                chunk_data = chunk_file.read()
                outfile.write(chunk_data)
            
            print(f"Added {chunk_info['filename']}")
    
    # Verify reconstructed file size
    reconstructed_size = Path(output_file).stat().st_size
    if reconstructed_size == metadata['original_size']:
        print(f"\n✅ Model reconstructed successfully: {output_file}")
        print(f"Size: {reconstructed_size} bytes")
        return True
    else:
        print(f"\n❌ Size mismatch after reconstruction!")
        print(f"Expected: {metadata['original_size']}, Got: {reconstructed_size}")
        return False

def main():
    parser = argparse.ArgumentParser(description="VeriChain Model Chunker")
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # Chunk command
    chunk_parser = subparsers.add_parser('chunk', help='Chunk a model file')
    chunk_parser.add_argument('input', help='Input model file')
    chunk_parser.add_argument('output', help='Output directory for chunks')
    chunk_parser.add_argument('--size', type=float, default=DEFAULT_CHUNK_SIZE_MB, 
                             help=f'Chunk size in MB (default: {DEFAULT_CHUNK_SIZE_MB})')
    
    # Verify command
    verify_parser = subparsers.add_parser('verify', help='Verify chunk integrity')
    verify_parser.add_argument('chunks_dir', help='Directory containing chunks')
    
    # Reconstruct command
    reconstruct_parser = subparsers.add_parser('reconstruct', 
                                              help='Reconstruct model from chunks')
    reconstruct_parser.add_argument('chunks_dir', help='Directory containing chunks')
    reconstruct_parser.add_argument('output', help='Output model file')
    
    args = parser.parse_args()
    
    if args.command == 'chunk':
        chunk_model(args.input, args.output, args.size)
    elif args.command == 'verify':
        verify_chunks(args.chunks_dir)
    elif args.command == 'reconstruct':
        reconstruct_model(args.chunks_dir, args.output)
    else:
        parser.print_help()

if __name__ == '__main__':
    main()
