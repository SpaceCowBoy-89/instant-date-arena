#!/usr/bin/env python3
"""
Setup script for image moderation training
Prepares Google Colab environment and downloads datasets
"""

import os
import sys
import subprocess
import json
from pathlib import Path

def install_requirements():
    """Install required packages for training"""
    requirements = [
        "torch",
        "torchvision", 
        "transformers",
        "datasets",
        "pillow",
        "scikit-learn",
        "accelerate",
        "bitsandbytes",
        "optimum",
        "huggingface_hub",
        "wandb",
        "onnx",
        "onnxruntime"
    ]
    
    for package in requirements:
        print(f"Installing {package}...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", package])

def setup_directories():
    """Create necessary directories"""
    directories = [
        "models",
        "data", 
        "outputs",
        "checkpoints"
    ]
    
    for directory in directories:
        Path(directory).mkdir(exist_ok=True)
        print(f"Created directory: {directory}")

def download_datasets():
    """Download and prepare datasets"""
    from datasets import load_dataset
    import requests
    import zipfile
    
    print("Downloading Hateful Memes dataset...")
    try:
        hateful_memes = load_dataset("emily49/hateful-memes")
        print(f"Hateful memes loaded: {len(hateful_memes['train'])} train, {len(hateful_memes['validation'])} val")
    except Exception as e:
        print(f"Error loading hateful memes: {e}")
    
    print("Loading NSFW dataset from Hugging Face...")
    try:
        # Load dataset directly from Hugging Face
        nsfw_dataset = load_dataset("deepghs/nsfw_detect")
        print(f"NSFW dataset loaded successfully")
        print(f"Available splits: {list(nsfw_dataset.keys())}")
        
        # Print basic info about the dataset
        for split_name in nsfw_dataset.keys():
            split_data = nsfw_dataset[split_name]
            print(f"{split_name}: {len(split_data)} samples")
            if len(split_data) > 0:
                sample = split_data[0]
                print(f"  Sample columns: {list(sample.keys())}")
        
        print("NSFW dataset ready")
    except Exception as e:
        print(f"Error loading NSFW dataset: {e}")
        print("You may need to request access to the dataset or check if it's available")
        
        # Try alternative approach
        try:
            from huggingface_hub import snapshot_download
            print("Trying alternative download method...")
            dataset_path = snapshot_download(
                repo_id="deepghs/nsfw_detect",
                repo_type="dataset",
                cache_dir="./nsfw_cache"
            )
            print(f"Dataset downloaded to: {dataset_path}")
        except Exception as e2:
            print(f"Alternative download also failed: {e2}")
            print("Will proceed with hateful memes dataset only")

def create_config():
    """Create training configuration file"""
    config = {
        "model": {
            "name": "openai/clip-vit-base-patch32",
            "num_classes": 5,
            "class_names": [
                "safe",
                "nsfw_explicit", 
                "nsfw_suggestive",
                "hate_violence",
                "inappropriate"
            ]
        },
        "training": {
            "epochs": 10,
            "batch_size": 16,
            "learning_rate": 1e-4,
            "weight_decay": 1e-5,
            "target_accuracy": 0.95,
            "patience": 3
        },
        "data": {
            "train_split": 0.8,
            "val_split": 0.1, 
            "test_split": 0.1,
            "image_size": 224
        },
        "quantization": {
            "enabled": True,
            "dtype": "int8",
            "calibration_samples": 100
        }
    }
    
    with open("training_config.json", "w") as f:
        json.dump(config, f, indent=2)
    
    print("Configuration file created: training_config.json")

def verify_gpu():
    """Check if GPU is available"""
    try:
        import torch
        if torch.cuda.is_available():
            print(f"GPU available: {torch.cuda.get_device_name(0)}")
            print(f"CUDA version: {torch.version.cuda}")
            return True
        else:
            print("No GPU available - training will be slower")
            return False
    except ImportError:
        print("PyTorch not installed yet")
        return False

def main():
    """Main setup function"""
    print("=== Image Moderation Training Setup ===")
    print("Setting up environment for CLIP-based image moderation training...")
    
    # Check if running in Colab
    try:
        import google.colab
        print("Running in Google Colab environment")
        in_colab = True
    except ImportError:
        print("Running in local environment")
        in_colab = False
    
    # Install requirements
    print("\n1. Installing requirements...")
    install_requirements()
    
    # Setup directories
    print("\n2. Setting up directories...")
    setup_directories()
    
    # Check GPU
    print("\n3. Checking GPU availability...")
    gpu_available = verify_gpu()
    
    # Download datasets
    print("\n4. Downloading datasets...")
    download_datasets()
    
    # Create config
    print("\n5. Creating configuration...")
    create_config()
    
    print("\n=== Setup Complete ===")
    print(f"GPU Available: {gpu_available}")
    print("Next steps:")
    print("1. Open the image_moderation_training.ipynb notebook")
    print("2. Run all cells to train the model")
    print("3. Download the trained model files")
    print("4. Copy models to your app's assets directory")
    
    if in_colab:
        print("\nColab-specific notes:")
        print("- Make sure to enable GPU runtime (Runtime > Change runtime type > GPU)")
        print("- Files will be lost when session ends - download important files!")
        print("- Consider mounting Google Drive to save outputs")

if __name__ == "__main__":
    main()