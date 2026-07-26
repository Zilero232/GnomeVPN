!macro UninstallLegacyMsi ROOT
  StrCpy $1 0
  ${Do}
    EnumRegKey $2 ${ROOT} "Software\Microsoft\Windows\CurrentVersion\Uninstall" $1
    ${If} $2 == ""
      ${ExitDo}
    ${EndIf}

    ReadRegStr $3 ${ROOT} "Software\Microsoft\Windows\CurrentVersion\Uninstall\$2" "DisplayName"
    ReadRegStr $4 ${ROOT} "Software\Microsoft\Windows\CurrentVersion\Uninstall\$2" "WindowsInstaller"

    ${If} $3 == "GnomeVPN"
    ${AndIf} $4 != ""
      nsExec::ExecToLog 'msiexec.exe /x $2 /qn /norestart'
      Pop $0
    ${EndIf}

    IntOp $1 $1 + 1
  ${Loop}
!macroend

!macro NSIS_HOOK_PREINSTALL
  ; `net stop` blocks until the service has actually stopped, unlike `sc stop`
  ; which returns immediately and leaves the binary locked for a moment longer.
  ; A failure here just means the service was not installed yet.
  nsExec::ExecToLog 'net stop GnomeVPNService'
  Pop $0

  ; sing-box.exe is a child of the service, not the service itself, so stopping
  ; the service does not always take it down. A survivor keeps its own file
  ; locked and the update fails to overwrite it.
  nsExec::ExecToLog 'taskkill.exe /F /IM sing-box.exe'
  Pop $0

  ; Releases up to v0.3.0 shipped an MSI. An NSIS installer cannot see or replace
  ; an MSI install, so without this a user who installed the MSI keeps it and
  ; ends up with two copies. Find any GnomeVPN MSI product in both registry views
  ; and uninstall it silently before we lay down the NSIS install.
  !insertmacro UninstallLegacyMsi HKLM
  !insertmacro UninstallLegacyMsi HKCU
!macroend

!macro NSIS_HOOK_POSTINSTALL
  ; install идемпотентен: при обновлении переписывает конфигурацию существующей
  ; службы, при первой установке создаёт новую.
  nsExec::ExecToLog '"$INSTDIR\gnomevpn-service.exe" install'
  Pop $0

  ${If} $0 != 0
    MessageBox MB_ICONEXCLAMATION|MB_OK \
      "Не удалось установить службу GnomeVPN (код $0).$\n$\nПриложение установлено, но подключение работать не будет. Попробуйте переустановить от имени администратора."
  ${EndIf}

  ; Windows toasts read the icon from this key, not from the `icon` field of the
  ; notification. IconUri must point at an image file — `app.exe,0` resolves for
  ; shortcuts but leaves toasts blank.
  WriteRegStr HKLM "Software\Classes\AppUserModelId\app.gnomevpn.desktop" "DisplayName" "GnomeVPN"
  WriteRegStr HKLM "Software\Classes\AppUserModelId\app.gnomevpn.desktop" "IconUri" "$INSTDIR\icons\128x128.png"
  WriteRegDWORD HKLM "Software\Classes\AppUserModelId\app.gnomevpn.desktop" "ShowInSettings" 1
!macroend

!macro NSIS_HOOK_PREUNINSTALL
  nsExec::ExecToLog '"$INSTDIR\gnomevpn-service.exe" uninstall'
  Pop $0

  nsExec::ExecToLog 'sc.exe delete GnomeVPNService'
  Pop $0
!macroend

!macro NSIS_HOOK_POSTUNINSTALL
  DeleteRegKey HKLM "Software\Classes\AppUserModelId\app.gnomevpn.desktop"
!macroend
