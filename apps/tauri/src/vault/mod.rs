const SERVICE: &str = "GnomeVPN";
const ACCOUNT: &str = "session-token";

#[derive(Debug, thiserror::Error)]
pub enum VaultError {
    #[error("vault error: {0}")]
    Backend(String),
}

impl serde::Serialize for VaultError {
    fn serialize<S: serde::Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        serializer.serialize_str(&self.to_string())
    }
}

#[cfg(desktop)]
fn entry() -> Result<keyring::Entry, VaultError> {
    keyring::Entry::new(SERVICE, ACCOUNT).map_err(|e| VaultError::Backend(e.to_string()))
}

#[tauri::command]
pub async fn vault_save_token(token: String) -> Result<(), VaultError> {
    #[cfg(desktop)]
    {
        entry()?.set_password(&token).map_err(|e| VaultError::Backend(e.to_string()))
    }
    #[cfg(not(desktop))]
    {
        let _ = token;
        Ok(())
    }
}

#[tauri::command]
pub async fn vault_read_token() -> Result<Option<String>, VaultError> {
    #[cfg(desktop)]
    {
        match entry()?.get_password() {
            Ok(token) => Ok(Some(token)),
            Err(keyring::Error::NoEntry) => Ok(None),
            Err(error) => Err(VaultError::Backend(error.to_string())),
        }
    }
    #[cfg(not(desktop))]
    {
        Ok(None)
    }
}

#[tauri::command]
pub async fn vault_clear_token() -> Result<(), VaultError> {
    #[cfg(desktop)]
    {
        match entry()?.delete_credential() {
            Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
            Err(error) => Err(VaultError::Backend(error.to_string())),
        }
    }
    #[cfg(not(desktop))]
    {
        Ok(())
    }
}
