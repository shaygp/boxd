import Capacitor
import UIKit

extension CAPBridgeViewController {
    open override func viewDidLoad() {
        super.viewDidLoad()

        // Force WebView opaque background - fixes iOS checkerboard pattern
        webView?.isOpaque = true
        webView?.backgroundColor = UIColor.black
        webView?.scrollView.backgroundColor = UIColor.black
    }
}
