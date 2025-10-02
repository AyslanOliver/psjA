# Configuração do Ambiente Android para APK

## Problemas Identificados
- Android SDK instalado mas `avdmanager` não está no PATH
- Necessário targetSdkVersion 35 ou superior

## Soluções

### 1. Configurar Android SDK Path
Adicione estas variáveis ao PATH do Windows:

```
ANDROID_HOME=C:\Users\[SEU_USUARIO]\AppData\Local\Android\Sdk
ANDROID_SDK_ROOT=%ANDROID_HOME%
```

E adicione ao PATH:
```
%ANDROID_HOME%\tools
%ANDROID_HOME%\tools\bin
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\cmdline-tools\latest\bin
```

### 2. Instalar Android SDK Tools
Execute no terminal como administrador:
```bash
# Instalar SDK Platform 35
sdkmanager "platforms;android-35"

# Instalar Build Tools
sdkmanager "build-tools;35.0.0"

# Instalar Command Line Tools
sdkmanager "cmdline-tools;latest"
```

### 3. Alternativa: Android Studio
1. Instale o Android Studio
2. Abra SDK Manager
3. Instale:
   - Android SDK Platform 35
   - Android SDK Build-Tools 35.0.0
   - Android SDK Command-line Tools

### 4. Verificar Configuração
```bash
cordova requirements android
```

### 5. Build do APK
```bash
# Build para desenvolvimento
cordova build android

# Build para produção (release)
cordova build android --release
```

## Status Atual
✅ Frontend configurado para produção
✅ API pronta para deploy no Render
⚠️ Ambiente Android precisa ser configurado

## Próximos Passos
1. Configure o Android SDK conforme instruções acima
2. Execute `cordova build android`
3. O APK será gerado em: `platforms/android/app/build/outputs/apk/`