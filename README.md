# Projet : Configurateur de voiture par contraintes (CSP + OR-Tools)

Ce projet illustre le **Sujet 19 – Configuration de produit par contraintes** avec
une démo interactive de **configurateur de voiture** :

- Backend en **Python + FastAPI + OR-Tools CP-SAT**
- Frontend en **HTML/CSS/JavaScript** simple
- Propagation des contraintes en temps réel

## Structure

- `backend/` : API FastAPI + modèle CSP (OR-Tools)
- `frontend/` : Interface web minimaliste qui interroge l'API

## Démarrage rapide

### 1. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # ou venv\Scripts\activate sous Windows
pip install -r requirements.txt
uvicorn main:app --reload
```

L'API écoute sur `http://127.0.0.1:8000`.

### 2. Frontend

Ouvrir `frontend/index.html` dans un navigateur.

> À chaque sélection, les options incompatibles sont désactivées grâce à la
> propagation des contraintes côté backend (OR-Tools CP-SAT).
