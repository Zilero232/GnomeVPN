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
