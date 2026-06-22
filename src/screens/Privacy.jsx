export default function Privacy({ onBack }) {
  return (
    <div className="screen">
      <div className="screen-header">
        <h1>Privacy Policy</h1>
        <p>EPC Estimator</p>
      </div>
      <div className="screen-body">
        <p className="privacy-date">Last updated: 20 June 2026</p>

        <h2 className="privacy-h2">1. Who we are</h2>
        <p className="privacy-p">EPC Estimator is a free tool that helps homeowners estimate their property's Energy Performance Certificate (EPC) rating. The app is operated by Luke Holder.</p>
        <p className="privacy-p">Contact: <a href="mailto:lukeaholder@googlemail.com" className="privacy-link">lukeaholder@googlemail.com</a></p>

        <h2 className="privacy-h2">2. What data we collect</h2>
        <p className="privacy-p">EPC Estimator does not collect, transmit, or store any personal data on external servers. Specifically:</p>
        <ul className="privacy-list">
          <li>All answers you enter during the questionnaire are processed entirely within your browser.</li>
          <li>If you choose to save an estimate, it is stored only in your browser's local storage (localStorage) on your device. It is never sent to us or any third party.</li>
          <li>We do not use analytics, tracking pixels, or session recording tools.</li>
          <li>We do not collect names, email addresses, or any personally identifiable information unless you voluntarily provide an email address to receive your estimate by email.</li>
        </ul>

        <h2 className="privacy-h2">3. Share by email</h2>
        <p className="privacy-p">If you tap "Share" on the results screen and enter your email address, we will send you an image of your EPC estimate results. To do this, your email address and a screenshot image of your results are transmitted to our server. Your email address is used only to deliver this one-time message and is not stored, shared with third parties, or used for marketing purposes.</p>

        <h2 className="privacy-h2">4. Cookies and advertising</h2>
        <p className="privacy-p">This app may display advertisements served by Google AdSense. Google AdSense uses cookies to serve ads based on your prior visits to this and other websites. You can opt out of personalised advertising by visiting <a href="https://www.google.com/settings/ads" className="privacy-link" target="_blank" rel="noopener noreferrer">Google Ads Settings</a>.</p>
        <p className="privacy-p">For more information on how Google uses data, see: <a href="https://policies.google.com/technologies/partner-sites" className="privacy-link" target="_blank" rel="noopener noreferrer">How Google uses data when you use our partners' sites or apps</a>.</p>

        <h2 className="privacy-h2">5. Local storage</h2>
        <p className="privacy-p">We use your browser's localStorage to save estimates you choose to store. This data stays on your device and can be deleted at any time by clearing your browser data or using the delete option within the app.</p>

        <h2 className="privacy-h2">6. Third-party links</h2>
        <p className="privacy-p">This app may contain links to external websites. We are not responsible for the privacy practices of those sites.</p>

        <h2 className="privacy-h2">7. Children</h2>
        <p className="privacy-p">This app is not directed at children under 13. We do not knowingly collect data from children.</p>

        <h2 className="privacy-h2">8. Changes to this policy</h2>
        <p className="privacy-p">We may update this policy from time to time. The date at the top of this page will reflect any changes.</p>

        <h2 className="privacy-h2">9. Your rights</h2>
        <p className="privacy-p">As we do not store personal data on our servers, there is no data for us to access, correct, or delete on your behalf. For any questions, contact us at <a href="mailto:lukeaholder@googlemail.com" className="privacy-link">lukeaholder@googlemail.com</a>.</p>

        <div style={{ height: 24 }} />
        <button className="btn-outline" onClick={onBack}>← Back</button>
        <div style={{ height: 32 }} />
      </div>
    </div>
  )
}
