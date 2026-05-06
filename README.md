# 🛡️ DeepGuard AI

**DeepGuard AI** is a state-of-the-art multimodal deepfake detection application. With the rise of highly realistic synthetic media, it has become increasingly crucial to have reliable tools to verify authenticity. DeepGuard AI is designed to analyze **Images, Videos, and Audio** and identify potential deepfakes with high accuracy. 

It also includes advanced **visual explainability** tools like interactive Grad-CAM heatmaps to help users see exactly *why* a piece of media was flagged as fake.

---

## ✨ Features

- **Multimodal Detection**: Supports Images (.jpg, .png), Video (.mp4), and Audio (.wav, .mp3).
- **Interactive Heatmap Comparison**: Built-in draggable slider to compare the original image side-by-side with its AI-generated Grad-CAM heatmap. 
- **Detailed Diagnostic Reports**: Automatically generates and allows users to download comprehensive PDF reports of the analysis.
- **Glassmorphic & 3D UI**: Stunning modern UI built with Tailwind CSS, Framer Motion, and React Three Fiber.
- **Lightning Fast Backend**: Powered by Python and FastAPI for fast and asynchronous model inference.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React + Vite
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **3D Graphics**: React Three Fiber / Drei
- **Icons**: Lucide React

### Backend
- **Framework**: FastAPI (Python)
- **Server**: Uvicorn
- **Machine Learning**: (Integrated within PyTorch/TensorFlow backend)

---

## 🚀 Getting Started

Follow these steps to run the project locally on your machine.

### 1. Start the Backend API
Navigate to the `backend` directory, install the required packages, and run the server:
```bash
cd backend

# Create a virtual environment (Optional but recommended)
# python -m venv venv
# .\venv\Scripts\activate   # (On Windows)

# Install requirements
pip install fastapi uvicorn python-multipart

# Start the FastAPI server
uvicorn main:app --reload
```
The backend API will run on `http://127.0.0.1:8000`.

### 2. Start the Frontend App
Open a new terminal, navigate to the `frontend` directory, install dependencies, and run the dev server:
```bash
cd frontend

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```
The frontend application will be available at `http://localhost:5173/`.

---

## 📂 Project Structure

```
DeepGuard-AI/
├── backend/
│   ├── api/            # API routes and endpoints
│   ├── models/         # Machine learning models (Audio, Image, Video)
│   ├── services/       # Core business logic
│   └── main.py         # FastAPI application entry point
├── frontend/
│   ├── src/            
│   │   ├── components/ # Reusable UI components (ResultCard, HeatmapComparison)
│   │   ├── App.jsx     # Main React Application
│   │   └── index.css   # Global styles and Tailwind configuration
│   └── package.json    # Frontend dependencies
└── README.md
```

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check out the [issues page](https://github.com/Palakagarwal28/DeepGuard-AI/issues).
