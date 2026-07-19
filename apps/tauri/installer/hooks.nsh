!macro NSIS_HOOK_PREINSTALL
  ; `net stop` blocks until the service has actually stopped, unlike `sc stop`
  ; which returns immediately and leaves the binary locked for a moment longer.
  ; A failure here just means the service was not installed yet.
  nsExec::ExecToLog 'net stop GnomeVPNService'
  Pop $0
!macroend

!macro NSIS_HOOK_POSTINSTALL
  ; install идемпотентен: при обновлении переписывает конфигурацию существующей
  ; службы, при первой установке создаёт новую.
  nsExec::ExecToLog '"$INSTDIR\resources\gnomevpn-service.exe" install'
  Pop $0

  ${If} $0 != 0
    MessageBox MB_ICONEXCLAMATION|MB_OK \
      "Не удалось установить службу GnomeVPN (код $0).$\n$\nПриложение установлено, но подключение работать не будет. Попробуйте переустановить от имени администратора."
  ${EndIf}
!macroend

!macro NSIS_HOOK_PREUNINSTALL
  nsExec::ExecToLog '"$INSTDIR\resources\gnomevpn-service.exe" uninstall'
  Pop $0

  nsExec::ExecToLog 'sc.exe delete GnomeVPNService'
  Pop $0
!macroend

!macro NSIS_HOOK_POSTUNINSTALL
!macroend
