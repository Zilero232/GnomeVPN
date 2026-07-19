!macro NSIS_HOOK_PREINSTALL
  nsExec::ExecToLog 'sc.exe stop GnomeVPNService'
  Pop $0

  ; sc возвращает управление до фактической остановки: без ожидания файл службы
  ; остаётся занят и копирование новой версии падает.
  StrCpy $1 0

  ${Do}
    Sleep 500
    IntOp $1 $1 + 1

    nsExec::ExecToStack 'sc.exe query GnomeVPNService'
    Pop $0
    Pop $2

    ${If} $0 != 0
      ${Break}
    ${EndIf}

    ${StrContains} $3 "STOPPED" $2

    ${If} $3 != ""
      ${Break}
    ${EndIf}
  ${LoopUntil} $1 >= 30
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
