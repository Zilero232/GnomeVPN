use std::net::{IpAddr, Ipv4Addr, Ipv6Addr, SocketAddr, ToSocketAddrs};
use std::sync::Arc;
use std::time::{Duration, Instant};

use quinn::crypto::rustls::QuicClientConfig;
use quinn::{ClientConfig, Endpoint};
use rustls::client::danger::{HandshakeSignatureValid, ServerCertVerified, ServerCertVerifier};
use rustls::pki_types::{CertificateDer, ServerName, UnixTime};
use rustls::{DigitallySignedStruct, SignatureScheme};

const ALPN: &[u8] = b"h3";

const HANDSHAKE_TIMEOUT: Duration = Duration::from_secs(3);

const IDLE_TIMEOUT_MS: u32 = 3_000;

const DRAIN_TIMEOUT: Duration = Duration::from_millis(200);

#[derive(Debug, thiserror::Error)]
pub enum LatencyError {
    #[error("cannot resolve {0}")]
    Resolve(String),
    #[error("probe failed: {0}")]
    Probe(String),
    #[error("timed out")]
    Timeout,
}

#[derive(Debug)]
struct AcceptAnyCertificate;

impl ServerCertVerifier for AcceptAnyCertificate {
    fn verify_server_cert(
        &self,
        _end_entity: &CertificateDer<'_>,
        _intermediates: &[CertificateDer<'_>],
        _server_name: &ServerName<'_>,
        _ocsp_response: &[u8],
        _now: UnixTime,
    ) -> Result<ServerCertVerified, rustls::Error> {
        Ok(ServerCertVerified::assertion())
    }

    fn verify_tls12_signature(
        &self,
        _message: &[u8],
        _cert: &CertificateDer<'_>,
        _dss: &DigitallySignedStruct,
    ) -> Result<HandshakeSignatureValid, rustls::Error> {
        Ok(HandshakeSignatureValid::assertion())
    }

    fn verify_tls13_signature(
        &self,
        _message: &[u8],
        _cert: &CertificateDer<'_>,
        _dss: &DigitallySignedStruct,
    ) -> Result<HandshakeSignatureValid, rustls::Error> {
        Ok(HandshakeSignatureValid::assertion())
    }

    fn supported_verify_schemes(&self) -> Vec<SignatureScheme> {
        vec![
            SignatureScheme::RSA_PKCS1_SHA256,
            SignatureScheme::RSA_PKCS1_SHA384,
            SignatureScheme::RSA_PKCS1_SHA512,
            SignatureScheme::ECDSA_NISTP256_SHA256,
            SignatureScheme::ECDSA_NISTP384_SHA384,
            SignatureScheme::ECDSA_NISTP521_SHA512,
            SignatureScheme::RSA_PSS_SHA256,
            SignatureScheme::RSA_PSS_SHA384,
            SignatureScheme::RSA_PSS_SHA512,
            SignatureScheme::ED25519,
        ]
    }
}

fn resolve(host: &str, port: u16) -> Result<SocketAddr, LatencyError> {
    if let Ok(ip) = host.parse::<IpAddr>() {
        return Ok(SocketAddr::new(ip, port));
    }

    (host, port)
        .to_socket_addrs()
        .map_err(|_| LatencyError::Resolve(host.to_string()))?
        .next()
        .ok_or_else(|| LatencyError::Resolve(host.to_string()))
}

fn client_config() -> Result<ClientConfig, LatencyError> {
    let mut crypto = rustls::ClientConfig::builder()
        .dangerous()
        .with_custom_certificate_verifier(Arc::new(AcceptAnyCertificate))
        .with_no_client_auth();

    crypto.alpn_protocols = vec![ALPN.to_vec()];

    let quic = QuicClientConfig::try_from(crypto)
        .map_err(|error| LatencyError::Probe(error.to_string()))?;

    let mut config = ClientConfig::new(Arc::new(quic));
    let mut transport = quinn::TransportConfig::default();

    transport.max_idle_timeout(Some(
        quinn::IdleTimeout::try_from(Duration::from_millis(u64::from(IDLE_TIMEOUT_MS)))
            .map_err(|error| LatencyError::Probe(error.to_string()))?,
    ));
    transport.keep_alive_interval(None);

    config.transport_config(Arc::new(transport));

    Ok(config)
}

fn bind_for(remote: &SocketAddr) -> SocketAddr {
    if remote.is_ipv6() {
        SocketAddr::new(IpAddr::V6(Ipv6Addr::UNSPECIFIED), 0)
    } else {
        SocketAddr::new(IpAddr::V4(Ipv4Addr::UNSPECIFIED), 0)
    }
}

pub async fn probe_latency(
    host: &str,
    port: u16,
    server_name: &str,
) -> Result<Duration, LatencyError> {
    let remote = resolve(host, port)?;

    let mut endpoint = Endpoint::client(bind_for(&remote))
        .map_err(|error| LatencyError::Probe(error.to_string()))?;

    endpoint.set_default_client_config(client_config()?);

    let started = Instant::now();

    let connecting = endpoint
        .connect(remote, server_name)
        .map_err(|error| LatencyError::Probe(error.to_string()))?;

    let outcome = tokio::time::timeout(HANDSHAKE_TIMEOUT, connecting).await;

    let elapsed = started.elapsed();

    let result = match outcome {
        Err(_) => Err(LatencyError::Timeout),
        Ok(Err(error)) => Err(LatencyError::Probe(error.to_string())),
        Ok(Ok(connection)) => {
            let rtt = connection.rtt();

            connection.close(0u32.into(), b"");

            Ok(if rtt.is_zero() { elapsed } else { rtt })
        }
    };

    let _ = tokio::time::timeout(DRAIN_TIMEOUT, endpoint.wait_idle()).await;

    result
}
