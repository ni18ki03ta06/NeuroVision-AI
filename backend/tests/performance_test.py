import time
import io
import asyncio
import httpx
import psutil
import os
from PIL import Image
from statistics import mean

# Target address for local FastAPI server
URL = "http://localhost:8000"

def get_process_memory():
    """Returns the resident set size (RSS) memory of the current process in MB."""
    process = psutil.Process(os.getpid())
    return process.memory_info().rss / (1024 * 1024)

def generate_image(size_px):
    """Generates a square RGB dummy image byte buffer for mock queries."""
    img = Image.new('RGB', (size_px, size_px), color='blue')
    buf = io.BytesIO()
    img.save(buf, format='JPEG')
    return buf.getvalue()

async def _run_single_request(client, img_bytes):
    """Fires a single predict request and returns the latency duration alongside response status."""
    start = time.perf_counter()
    files = {"file": ("test.jpg", img_bytes, "image/jpeg")}
    data = {"modality": "Auto-detect"}
    try:
        response = await client.post(f"{URL}/api/predict", files=files, data=data)
        latency = time.perf_counter() - start
        return latency, response.status_code
    except Exception:
        latency = time.perf_counter() - start
        return latency, 500

async def main():
    print("=" * 70)
    print("         NeuroVision AI — API Backend Performance Telemetry Suite")
    print("=" * 70)
    
    # 1. Initialize image sizes datasets
    sizes = {
        "Small (224x224)": 224, 
        "Medium (512x512)": 512, 
        "Large (1024x1024)": 1024
    }
    img_data = {name: generate_image(px) for name, px in sizes.items()}
    
    # Establish connection client
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            health = await client.get(f"{URL}/health")
            if health.status_code != 200:
                print("Error: Backend health check failed.")
                return
        except Exception:
            print("Error: Backend is not reachable on port 8000. Boot server first.")
            return
 
        # 2. Test Image Scaling Latencies
        print("\n[1] Testing Prediction Latency by Image Size (Single Requests):")
        for name, data in img_data.items():
            latencies = []
            mem_start = get_process_memory()
            
            # Execute 5 iterations per size to compute averages
            for _ in range(5):
                lat, status = await _run_single_request(client, data)
                if status == 200:
                    latencies.append(lat)
                    
            mem_end = get_process_memory()
            
            if latencies:
                avg_lat = mean(latencies)
                print(f"  - {name:16}: Avg Latency = {avg_lat:5.3f}s | Memory Diff = {mem_end - mem_start:+6.3f} MB")
            else:
                print(f"  - {name:16}: Prediction requests failed (check model files).")
 
        # 3. Test Concurrent Request Latencies (Load Testing)
        print("\n[2] Testing Concurrent Requests Load handling:")
        concurrent_counts = [5, 10, 20]
        data_224 = img_data["Small (224x224)"]
        
        for count in concurrent_counts:
            print(f"  - Dispatching {count} concurrent prediction requests...")
            start_load = time.perf_counter()
            tasks = [_run_single_request(client, data_224) for _ in range(count)]
            results = await asyncio.gather(*tasks)
            total_duration = time.perf_counter() - start_load
            
            latencies = [r[0] for r in results if r[1] == 200]
            success_count = len(latencies)
            
            print(f"    * Done in {total_duration:5.3f}s | Success rate: {success_count}/{count}")
            if latencies:
                print(f"    * Latency: Avg = {mean(latencies):5.3f}s | Min = {min(latencies):5.3f}s | Max = {max(latencies):5.3f}s")

if __name__ == "__main__":
    asyncio.run(main())
