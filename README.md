# JMH Stream - iOS App

Application iOS native (WKWebView) pour **jmhstream.online**.

## 📱 Comment obtenir l'IPA

1. Va dans l'onglet **Actions** de ce repo sur GitHub
2. Clique sur le dernier build **"Build JMHStream IPA"**
3. Télécharge **JMHStream-IPA** dans la section Artifacts
4. Tu obtiens un fichier `JMHStream-unsigned.ipa`

## 📲 Comment installer sur iPhone (via GBox)

1. Ouvre **GBox** sur ton iPhone ([gbox.run](https://gbox.run))
2. Importe le fichier `JMHStream-unsigned.ipa`
3. GBox va le signer avec un certificat et l'installer
4. Approve le profil dans **Réglages → Général → Gestion VPN et appareils**

## 🔄 Déclencher un nouveau build manuellement

1. Va dans **Actions** → **Build JMHStream IPA**
2. Clique **Run workflow** → **Run workflow**
3. Attends ~10-15 minutes
4. Télécharge le nouvel IPA

## 📁 Structure du repo

```
├── web/          → Code source de l'app web (jmhstream.online)
├── ios/          → Projet Xcode iOS (WKWebView wrapper)
│   ├── project.yml           → Config xcodegen
│   ├── JMHStream/            → Code Swift
│   │   ├── ViewController.swift  → Charge jmhstream.online
│   │   ├── AppDelegate.swift
│   │   ├── SceneDelegate.swift
│   │   └── Info.plist
│   └── ExportOptions.plist
└── .github/
    └── workflows/
        └── build-ipa.yml     → GitHub Actions IPA builder
```

## ⚙️ Modifier l'URL de l'app

Édite `ios/JMHStream/ViewController.swift` ligne :
```swift
private let appURL = "https://jmhstream.online"
```
