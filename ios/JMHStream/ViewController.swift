import UIKit
import WebKit

class ViewController: UIViewController, WKNavigationDelegate, WKUIDelegate {

    private var webView: WKWebView!
    private let appURL = "https://jmhstream.online"
    private var loadingView: UIView!
    private var activityIndicator: UIActivityIndicatorView!

    override func viewDidLoad() {
        super.viewDidLoad()
        setupWebView()
        setupLoadingView()
        loadApp()
    }

    private func setupWebView() {
        let configuration = WKWebViewConfiguration()
        configuration.allowsInlineMediaPlayback = true
        configuration.mediaTypesRequiringUserActionForPlayback = []
        configuration.preferences.javaScriptEnabled = true

        // Allow all content types including video
        let contentController = WKUserContentController()
        configuration.userContentController = contentController

        webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.allowsBackForwardNavigationGestures = true
        webView.scrollView.contentInsetAdjustmentBehavior = .automatic
        webView.translatesAutoresizingMaskIntoConstraints = false

        view.addSubview(webView)
        NSLayoutConstraint.activate([
            webView.topAnchor.constraint(equalTo: view.topAnchor),
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            webView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
    }

    private func setupLoadingView() {
        loadingView = UIView(frame: view.bounds)
        loadingView.backgroundColor = UIColor(red: 0.05, green: 0.05, blue: 0.1, alpha: 1)
        loadingView.autoresizingMask = [.flexibleWidth, .flexibleHeight]

        let logoLabel = UILabel()
        logoLabel.text = "JMH STREAM"
        logoLabel.textColor = .white
        logoLabel.font = UIFont.systemFont(ofSize: 28, weight: .bold)
        logoLabel.translatesAutoresizingMaskIntoConstraints = false

        activityIndicator = UIActivityIndicatorView(style: .large)
        activityIndicator.color = .white
        activityIndicator.translatesAutoresizingMaskIntoConstraints = false
        activityIndicator.startAnimating()

        loadingView.addSubview(logoLabel)
        loadingView.addSubview(activityIndicator)

        NSLayoutConstraint.activate([
            logoLabel.centerXAnchor.constraint(equalTo: loadingView.centerXAnchor),
            logoLabel.centerYAnchor.constraint(equalTo: loadingView.centerYAnchor, constant: -40),
            activityIndicator.centerXAnchor.constraint(equalTo: loadingView.centerXAnchor),
            activityIndicator.topAnchor.constraint(equalTo: logoLabel.bottomAnchor, constant: 20)
        ])

        view.addSubview(loadingView)
    }

    private func loadApp() {
        guard let url = URL(string: appURL) else { return }
        let request = URLRequest(url: url, cachePolicy: .returnCacheDataElseLoad, timeoutInterval: 30)
        webView.load(request)
    }

    // MARK: - WKNavigationDelegate
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        UIView.animate(withDuration: 0.3) {
            self.loadingView.alpha = 0
        } completion: { _ in
            self.loadingView.isHidden = true
            self.activityIndicator.stopAnimating()
        }
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        showError(error.localizedDescription)
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        showError(error.localizedDescription)
    }

    private func showError(_ message: String) {
        activityIndicator.stopAnimating()
        let label = UILabel()
        label.text = "Connexion impossible.\nVérifie ta connexion internet."
        label.textColor = .white
        label.numberOfLines = 0
        label.textAlignment = .center
        label.translatesAutoresizingMaskIntoConstraints = false
        loadingView.addSubview(label)
        NSLayoutConstraint.activate([
            label.centerXAnchor.constraint(equalTo: loadingView.centerXAnchor),
            label.centerYAnchor.constraint(equalTo: loadingView.centerYAnchor),
            label.widthAnchor.constraint(equalToConstant: 280)
        ])

        let retry = UIButton(type: .system)
        retry.setTitle("Réessayer", for: .normal)
        retry.setTitleColor(.white, for: .normal)
        retry.backgroundColor = UIColor(red: 0.2, green: 0.4, blue: 0.8, alpha: 1)
        retry.layer.cornerRadius = 8
        retry.translatesAutoresizingMaskIntoConstraints = false
        retry.addTarget(self, action: #selector(retryLoad), for: .touchUpInside)
        loadingView.addSubview(retry)
        NSLayoutConstraint.activate([
            retry.centerXAnchor.constraint(equalTo: loadingView.centerXAnchor),
            retry.topAnchor.constraint(equalTo: label.bottomAnchor, constant: 20),
            retry.widthAnchor.constraint(equalToConstant: 120),
            retry.heightAnchor.constraint(equalToConstant: 44)
        ])
    }

    @objc private func retryLoad() {
        for subview in loadingView.subviews {
            if subview is UILabel || subview is UIButton { subview.removeFromSuperview() }
        }
        activityIndicator.startAnimating()
        loadApp()
    }

    // Support for video fullscreen
    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        if navigationAction.targetFrame == nil {
            webView.load(navigationAction.request)
        }
        return nil
    }
}
