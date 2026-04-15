# JMH Stream - iOS App

Application iOS native (WKWebView) pour **jmhstream.online**.

## 🚀 Compiler l'IPA avec Codemagic (GRATUIT)

### Étape 1 — Connecter le repo à Codemagic
1. Va sur **[codemagic.io](https://codemagic.io)**
2. Clique **Sign up** → connecte-toi avec ton compte GitHub
3. Clique **Add application**
4. Sélectionne le repo **`Jmhstream-ios`**
5. Codemagic détecte automatiquement le fichier `codemagic.yaml`

### Étape 2 — Lancer un build
1. Dans Codemagic, clique sur ton projet
2. Sélectionne le workflow **"JMHStream iOS - Unsigned IPA (GBox ready)"**
3. Clique **Start new build**
4. Attends ~15-20 minutes (build sur Mac M2)

### Étape 3 — Télécharger l'IPA
1. Une fois le build terminé ✅, clique sur les **Artifacts**
2. Télécharge **`JMHStream-unsigned.ipa`**

### Étape 4 — Installer sur iPhone via GBox
1. Ouvre **GBox** sur ton iPhone → [gbox.run](https://gbox.run)
2. Clique **Import IPA** → sélectionne `JMHStream-unsigned.ipa`
3. GBox signe et installe l'app
4. Va dans **Réglages → Général → Gestion VPN et appareils** → approuve le profil
5. Lance **JMH Stream** depuis ton écran d'accueil 📱

## 📁 Structure du projet

```
├── codemagic.yaml     → Config CI/CD (Codemagic)
├── web/               → Code source app web (jmhstream.online)
├── ios/               → Projet Xcode iOS (WKWebView wrapper)
│   ├── project.yml        → Config xcodegen
│   ├── JMHStream/
│   │   ├── ViewController.swift   → Charge jmhstream.online
│   │   ├── AppDelegate.swift
│   │   ├── SceneDelegate.swift
│   │   └── Info.plist
│   └── ExportOptions.plist
└── .github/workflows/ → GitHub Actions (désactivé - compte verrouillé)
```

## ⚙️ Modifier l'URL de l'app

Édite `ios/JMHStream/ViewController.swift` ligne 12 :
```swift
private let appURL = "https://jmhstream.online"
```

## 🔄 Builds automatiques

Le build Codemagic se déclenche automatiquement à chaque push sur `main`.
500 minutes/mois gratuites incluses.