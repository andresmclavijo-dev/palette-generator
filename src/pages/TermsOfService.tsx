import { useEffect } from 'react'
import { Link } from 'react-router-dom'

const CONTENT = `<style>
  [data-custom-class='body'], [data-custom-class='body'] * {
    background: transparent !important;
  }
  [data-custom-class='title'], [data-custom-class='title'] * {
    font-family: Arial !important;
    font-size: 26px !important;
    color: #000000 !important;
  }
  [data-custom-class='subtitle'], [data-custom-class='subtitle'] * {
    font-family: Arial !important;
    color: #595959 !important;
    font-size: 14px !important;
  }
  [data-custom-class='heading_1'], [data-custom-class='heading_1'] * {
    font-family: Arial !important;
    font-size: 19px !important;
    color: #000000 !important;
  }
  [data-custom-class='heading_2'], [data-custom-class='heading_2'] * {
    font-family: Arial !important;
    font-size: 17px !important;
    color: #000000 !important;
  }
  [data-custom-class='body_text'], [data-custom-class='body_text'] * {
    color: #595959 !important;
    font-size: 14px !important;
    font-family: Arial !important;
  }
  [data-custom-class='link'], [data-custom-class='link'] * {
    color: #3030F1 !important;
    font-size: 14px !important;
    font-family: Arial !important;
    word-break: break-word !important;
  }
  ul {
    list-style-type: square;
  }
  ul > li > ul {
    list-style-type: circle;
  }
  ul > li > ul > li > ul {
    list-style-type: square;
  }
  ol li {
    font-family: Arial;
  }
</style>

<div data-custom-class="body">
  <div>
    <strong><span style="font-size: 26px;"><span data-custom-class="title"><h1>TERMS OF USE</h1></span></span></strong>
  </div>
  <div>
    <span style="color: rgb(127, 127, 127);"><strong><span style="font-size: 15px;"><span data-custom-class="subtitle">Last updated March 17, 2026</span></span></strong></span>
  </div>
  <div><br></div>
  <div><br></div>

  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="heading_1"><strong><h2>AGREEMENT TO OUR LEGAL TERMS</h2></strong></span></span>
  </div>

  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="body_text">We are Andres Clavijo (doing business as Paletta) ("<strong>Company</strong>," "<strong>we</strong>," "<strong>us</strong>," "<strong>our</strong>").</span></span>
  </div>
  <div style="line-height: 1.5;"><br></div>

  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="body_text">We operate the website <a href="https://www.usepaletta.io" target="_blank" data-custom-class="link">https://www.usepaletta.io</a>, as well as any other related products and services that refer or link to these legal terms (the "<strong>Legal Terms</strong>") (collectively, the "<strong>Services</strong>").</span></span>
  </div>
  <div style="line-height: 1.5;"><br></div>

  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="body_text">We provide a web-based color palette generator that helps designers create, customize, and export color palettes. It uses AI to suggest palettes, supports accessibility testing with vision simulations, and exports to CSS, Tailwind, and image formats.</span></span>
  </div>
  <div style="line-height: 1.5;"><br></div>

  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="body_text">You can contact us by email at <a href="mailto:hello@usepaletta.io" data-custom-class="link">hello@usepaletta.io</a> or by mail to 2108 Ariella Dr, Cedar Park, TX 78613, United States.</span></span>
  </div>
  <div style="line-height: 1.5;"><br></div>

  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="body_text">These Legal Terms constitute a legally binding agreement made between you, whether personally or on behalf of an entity ("<strong>you</strong>"), and Andres Clavijo (doing business as Paletta), concerning your access to and use of the Services. You agree that by accessing the Services, you have read, understood, and agreed to be bound by all of these Legal Terms. IF YOU DO NOT AGREE WITH ALL OF THESE LEGAL TERMS, THEN YOU ARE EXPRESSLY PROHIBITED FROM USING THE SERVICES AND YOU MUST DISCONTINUE USE IMMEDIATELY.</span></span>
  </div>
  <div style="line-height: 1.5;"><br></div>

  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="body_text">Supplemental terms and conditions or documents that may be posted on the Services from time to time are hereby expressly incorporated herein by reference. We reserve the right, in our sole discretion, to make changes or modifications to these Legal Terms at any time and for any reason. We will alert you about any changes by updating the "Last updated" date of these Legal Terms, and you waive any right to receive specific notice of each such change. It is your responsibility to periodically review these Legal Terms to stay informed of updates. You will be subject to, and will be deemed to have been made aware of and to have accepted, the changes in any revised Legal Terms by your continued use of the Services after the date such revised Legal Terms are posted. We will provide you with at least 7 days' advance notice of any changes, except for changes related to security updates or a court order, which may take effect immediately.</span></span>
  </div>
  <div style="line-height: 1.5;"><br></div>

  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="body_text">The Services are intended for users who are at least 18 years old. Persons under the age of 18 are not permitted to use or register for the Services.</span></span>
  </div>
  <div style="line-height: 1.5;"><br></div>

  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="body_text">We recommend that you print a copy of these Legal Terms for your records.</span></span>
  </div>
  <div style="line-height: 1.5;"><br></div>
  <div style="line-height: 1.5;"><br></div>

  <!-- TABLE OF CONTENTS -->
  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="heading_1"><strong><h2>TABLE OF CONTENTS</h2></strong></span></span>
  </div>

  <div style="line-height: 1.5;"><span style="font-size: 15px;"><a data-custom-class="link" href="#services"><span style="color: rgb(0, 58, 250);">1. OUR SERVICES</span></a></span></div>
  <div style="line-height: 1.5;"><span style="font-size: 15px;"><a data-custom-class="link" href="#ip"><span style="color: rgb(0, 58, 250);">2. INTELLECTUAL PROPERTY RIGHTS</span></a></span></div>
  <div style="line-height: 1.5;"><span style="font-size: 15px;"><a data-custom-class="link" href="#userreps"><span style="color: rgb(0, 58, 250);">3. USER REPRESENTATIONS</span></a></span></div>
  <div style="line-height: 1.5;"><span style="font-size: 15px;"><a data-custom-class="link" href="#userreg"><span style="color: rgb(0, 58, 250);">4. USER REGISTRATION</span></a></span></div>
  <div style="line-height: 1.5;"><span style="font-size: 15px;"><a data-custom-class="link" href="#purchases"><span style="color: rgb(0, 58, 250);">5. PURCHASES AND PAYMENT</span></a></span></div>
  <div style="line-height: 1.5;"><span style="font-size: 15px;"><a data-custom-class="link" href="#subscriptions"><span style="color: rgb(0, 58, 250);">6. SUBSCRIPTIONS</span></a></span></div>
  <div style="line-height: 1.5;"><span style="font-size: 15px;"><a data-custom-class="link" href="#prohibited"><span style="color: rgb(0, 58, 250);">7. PROHIBITED ACTIVITIES</span></a></span></div>
  <div style="line-height: 1.5;"><span style="font-size: 15px;"><a data-custom-class="link" href="#thirdparty"><span style="color: rgb(0, 58, 250);">8. THIRD-PARTY WEBSITES AND CONTENT</span></a></span></div>
  <div style="line-height: 1.5;"><span style="font-size: 15px;"><a data-custom-class="link" href="#sitemanage"><span style="color: rgb(0, 58, 250);">9. SERVICES MANAGEMENT</span></a></span></div>
  <div style="line-height: 1.5;"><span style="font-size: 15px;"><a data-custom-class="link" href="#ppyes"><span style="color: rgb(0, 58, 250);">10. PRIVACY POLICY</span></a></span></div>
  <div style="line-height: 1.5;"><span style="font-size: 15px;"><a data-custom-class="link" href="#terms"><span style="color: rgb(0, 58, 250);">11. TERM AND TERMINATION</span></a></span></div>
  <div style="line-height: 1.5;"><span style="font-size: 15px;"><a data-custom-class="link" href="#modifications"><span style="color: rgb(0, 58, 250);">12. MODIFICATIONS AND INTERRUPTIONS</span></a></span></div>
  <div style="line-height: 1.5;"><span style="font-size: 15px;"><a data-custom-class="link" href="#law"><span style="color: rgb(0, 58, 250);">13. GOVERNING LAW</span></a></span></div>
  <div style="line-height: 1.5;"><span style="font-size: 15px;"><a data-custom-class="link" href="#disputes"><span style="color: rgb(0, 58, 250);">14. DISPUTE RESOLUTION</span></a></span></div>
  <div style="line-height: 1.5;"><span style="font-size: 15px;"><a data-custom-class="link" href="#corrections"><span style="color: rgb(0, 58, 250);">15. CORRECTIONS</span></a></span></div>
  <div style="line-height: 1.5;"><span style="font-size: 15px;"><a data-custom-class="link" href="#disclaimer"><span style="color: rgb(0, 58, 250);">16. DISCLAIMER</span></a></span></div>
  <div style="line-height: 1.5;"><span style="font-size: 15px;"><a data-custom-class="link" href="#liability"><span style="color: rgb(0, 58, 250);">17. LIMITATIONS OF LIABILITY</span></a></span></div>
  <div style="line-height: 1.5;"><span style="font-size: 15px;"><a data-custom-class="link" href="#indemnification"><span style="color: rgb(0, 58, 250);">18. INDEMNIFICATION</span></a></span></div>
  <div style="line-height: 1.5;"><span style="font-size: 15px;"><a data-custom-class="link" href="#userdata"><span style="color: rgb(0, 58, 250);">19. USER DATA</span></a></span></div>
  <div style="line-height: 1.5;"><span style="font-size: 15px;"><a data-custom-class="link" href="#electronic"><span style="color: rgb(0, 58, 250);">20. ELECTRONIC COMMUNICATIONS, TRANSACTIONS, AND SIGNATURES</span></a></span></div>
  <div style="line-height: 1.5;"><span style="font-size: 15px;"><a data-custom-class="link" href="#misc"><span style="color: rgb(0, 58, 250);">21. MISCELLANEOUS</span></a></span></div>
  <div style="line-height: 1.5;"><span style="font-size: 15px;"><a data-custom-class="link" href="#figmaplugin"><span style="color: rgb(0, 58, 250);">22. FIGMA PLUGIN</span></a></span></div>
  <div style="line-height: 1.5;"><span style="font-size: 15px;"><a data-custom-class="link" href="#contact"><span style="color: rgb(0, 58, 250);">23. CONTACT US</span></a></span></div>

  <div style="line-height: 1.5;"><br></div>
  <div style="line-height: 1.5;"><br></div>

  <!-- 1. OUR SERVICES -->
  <div id="services" style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="heading_1"><strong><h2>1. OUR SERVICES</h2></strong></span></span>
  </div>
  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="body_text">The information provided when using the Services is not intended for distribution to or use by any person or entity in any jurisdiction or country where such distribution or use would be contrary to law or regulation or which would subject us to any registration requirement within such jurisdiction or country. Accordingly, those persons who choose to access the Services from other locations do so on their own initiative and are solely responsible for compliance with local laws, if and to the extent local laws are applicable.</span></span>
  </div>
  <div style="line-height: 1.5;"><br></div>

  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="body_text">The Services are not tailored to comply with industry-specific regulations (Health Insurance Portability and Accountability Act (HIPAA), Federal Information Security Management Act (FISMA), etc.), so if your interactions would be subjected to such laws, you may not use the Services. You may not use the Services in a way that would violate the Gramm-Leach-Bliley Act (GLBA).</span></span>
  </div>
  <div style="line-height: 1.5;"><br></div>

  <!-- 2. INTELLECTUAL PROPERTY RIGHTS -->
  <div id="ip" style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="heading_1"><strong><h2>2. INTELLECTUAL PROPERTY RIGHTS</h2></strong></span></span>
  </div>

  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="heading_2"><strong><h3>Our intellectual property</h3></strong></span></span>
  </div>

  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="body_text">We are the owner or the licensee of all intellectual property rights in our Services, including all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics in the Services (collectively, the "Content"), as well as the trademarks, service marks, and logos contained therein (the "Marks").</span></span>
  </div>
  <div style="line-height: 1.5;"><br></div>

  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="body_text">Our Content and Marks are protected by copyright and trademark laws (and various other intellectual property rights and unfair competition laws) and treaties in the United States and around the world.</span></span>
  </div>
  <div style="line-height: 1.5;"><br></div>

  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="body_text">The Content and Marks are provided in or through the Services "AS IS" for your personal, non-commercial use or internal business purpose only.</span></span>
  </div>
  <div style="line-height: 1.5;"><br></div>

  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="heading_2"><strong><h3>Your use of our Services</h3></strong></span></span>
  </div>

  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="body_text">Subject to your compliance with these Legal Terms, including the "<a href="#prohibited" data-custom-class="link">PROHIBITED ACTIVITIES</a>" section below, we grant you a non-exclusive, non-transferable, revocable license to access the Services and download or print a copy of any portion of the Content to which you have properly gained access solely for your personal, non-commercial use or internal business purpose.</span></span>
  </div>
  <div style="line-height: 1.5;"><br></div>

  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="body_text">Except as set out in this section or elsewhere in our Legal Terms, no part of the Services and no Content or Marks may be copied, reproduced, aggregated, republished, uploaded, posted, publicly displayed, encoded, translated, transmitted, distributed, sold, licensed, or otherwise exploited for any commercial purpose whatsoever, without our express prior written permission.</span></span>
  </div>
  <div style="line-height: 1.5;"><br></div>

  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="body_text">If you wish to make any use of the Services, Content, or Marks other than as set out in this section or elsewhere in our Legal Terms, please address your request to: <a href="mailto:hello@usepaletta.io" data-custom-class="link">hello@usepaletta.io</a>. If we ever grant you the permission to post, reproduce, or publicly display any part of our Services or Content, you must identify us as the owners or licensors of the Services, Content, or Marks and ensure that any copyright or proprietary notice appears or is visible on posting, reproducing, or displaying our Content.</span></span>
  </div>
  <div style="line-height: 1.5;"><br></div>

  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="body_text">We reserve all rights not expressly granted to you in and to the Services, Content, and Marks.</span></span>
  </div>
  <div style="line-height: 1.5;"><br></div>

  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="body_text">Any breach of these Intellectual Property Rights will constitute a material breach of our Legal Terms and your right to use our Services will terminate immediately.</span></span>
  </div>
  <div style="line-height: 1.5;"><br></div>

  <!-- 3. USER REPRESENTATIONS -->
  <div id="userreps" style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="heading_1"><strong><h2>3. USER REPRESENTATIONS</h2></strong></span></span>
  </div>

  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="body_text">By using the Services, you represent and warrant that: (1) all registration information you submit will be true, accurate, current, and complete; (2) you will maintain the accuracy of such information and promptly update such registration information as necessary; (3) you have the legal capacity and you agree to comply with these Legal Terms; (4) you are not under the age of 18; (5) you are not a minor in the jurisdiction in which you reside; (6) you will not access the Services through automated or non-human means, whether through a bot, script, or otherwise; (7) you will not use the Services for any illegal or unauthorized purpose; and (8) your use of the Services will not violate any applicable law or regulation.</span></span>
  </div>
  <div style="line-height: 1.5;"><br></div>

  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="body_text">If you provide any information that is untrue, inaccurate, not current, or incomplete, we have the right to suspend or terminate your account and refuse any and all current or future use of the Services (or any portion thereof).</span></span>
  </div>
  <div style="line-height: 1.5;"><br></div>

  <!-- 4. USER REGISTRATION -->
  <div id="userreg" style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="heading_1"><strong><h2>4. USER REGISTRATION</h2></strong></span></span>
  </div>

  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="body_text">You may be required to register to use the Services. You agree to keep your password confidential and will be responsible for all use of your account and password. We reserve the right to remove, reclaim, or change a username you select if we determine, in our sole discretion, that such username is inappropriate, obscene, or otherwise objectionable.</span></span>
  </div>
  <div style="line-height: 1.5;"><br></div>

  <!-- 5. PURCHASES AND PAYMENT -->
  <div id="purchases" style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="heading_1"><strong><h2>5. PURCHASES AND PAYMENT</h2></strong></span></span>
  </div>

  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="body_text">We accept the following forms of payment:</span></span>
  </div>

  <ul>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px;">Visa</span></li>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px;">Mastercard</span></li>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px;">American Express</span></li>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px;">Discover</span></li>
  </ul>

  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="body_text">You agree to provide current, complete, and accurate purchase and account information for all purchases made via the Services. You further agree to promptly update account and payment information, including email address, payment method, and payment card expiration date, so that we can complete your transactions and contact you as needed. Sales tax will be added to the price of purchases as deemed required by us. We may change prices at any time. All payments shall be in US dollars.</span></span>
  </div>
  <div style="line-height: 1.5;"><br></div>

  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="body_text">You agree to pay all charges at the prices then in effect for your purchases and any applicable shipping fees, and you authorize us to charge your chosen payment provider for any such amounts upon placing your order. We reserve the right to correct any errors or mistakes in pricing, even if we have already requested or received payment.</span></span>
  </div>
  <div style="line-height: 1.5;"><br></div>

  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="body_text">We reserve the right to refuse any order placed through the Services. We may, in our sole discretion, limit or cancel quantities purchased per person, per household, or per order. These restrictions may include orders placed by or under the same customer account, the same payment method, and/or orders that use the same billing or shipping address. We reserve the right to limit or prohibit orders that, in our sole judgment, appear to be placed by dealers, resellers, or distributors.</span></span>
  </div>
  <div style="line-height: 1.5;"><br></div>

  <!-- 6. SUBSCRIPTIONS -->
  <div id="subscriptions" style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="heading_1"><strong><h2>6. SUBSCRIPTIONS</h2></strong></span></span>
  </div>

  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="heading_2"><strong><h3>Billing and Renewal</h3></strong></span></span>
  </div>

  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="body_text">Your subscription will continue and automatically renew unless canceled. You consent to our charging your payment method on a recurring basis without requiring your prior approval for each recurring charge, until such time as you cancel the applicable order. The length of your billing cycle is determined by the subscription plan you choose (monthly or annual).</span></span>
  </div>
  <div style="line-height: 1.5;"><br></div>

  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="heading_2"><strong><h3>Cancellation</h3></strong></span></span>
  </div>

  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="body_text">You can cancel your subscription at any time by logging into your account or by contacting us using the contact information provided below. Your cancellation will take effect at the end of the current paid term. If you have any questions or are unsatisfied with our Services, please email us at <a href="mailto:hello@usepaletta.io" data-custom-class="link">hello@usepaletta.io</a>.</span></span>
  </div>
  <div style="line-height: 1.5;"><br></div>

  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="heading_2"><strong><h3>Fee Changes</h3></strong></span></span>
  </div>

  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="body_text">We may, from time to time, make changes to the subscription fee and will communicate any price changes to you in accordance with applicable law.</span></span>
  </div>
  <div style="line-height: 1.5;"><br></div>

  <!-- 7. PROHIBITED ACTIVITIES -->
  <div id="prohibited" style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="heading_1"><strong><h2>7. PROHIBITED ACTIVITIES</h2></strong></span></span>
  </div>

  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="body_text">You may not access or use the Services for any purpose other than that for which we make the Services available. The Services may not be used in connection with any commercial endeavors except those that are specifically endorsed or approved by us.</span></span>
  </div>
  <div style="line-height: 1.5;"><br></div>

  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="body_text">As a user of the Services, you agree not to:</span></span>
  </div>

  <ul>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px;">Systematically retrieve data or other content from the Services to create or compile, directly or indirectly, a collection, compilation, database, or directory without written permission from us.</span></li>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px;">Trick, defraud, or mislead us and other users, especially in any attempt to learn sensitive account information such as user passwords.</span></li>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px;">Circumvent, disable, or otherwise interfere with security-related features of the Services.</span></li>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px;">Disparage, tarnish, or otherwise harm, in our opinion, us and/or the Services.</span></li>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px;">Use any information obtained from the Services in order to harass, abuse, or harm another person.</span></li>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px;">Make improper use of our support services or submit false reports of abuse or misconduct.</span></li>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px;">Use the Services in a manner inconsistent with any applicable laws or regulations.</span></li>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px;">Engage in unauthorized framing of or linking to the Services.</span></li>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px;">Upload or transmit (or attempt to upload or to transmit) viruses, Trojan horses, or other material that interferes with any party's uninterrupted use and enjoyment of the Services.</span></li>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px;">Engage in any automated use of the system, such as using scripts to send comments or messages, or using any data mining, robots, or similar data gathering and extraction tools.</span></li>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px;">Delete the copyright or other proprietary rights notice from any Content.</span></li>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px;">Attempt to impersonate another user or person or use the username of another user.</span></li>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px;">Interfere with, disrupt, or create an undue burden on the Services or the networks or services connected to the Services.</span></li>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px;">Harass, annoy, intimidate, or threaten any of our employees or agents engaged in providing any portion of the Services to you.</span></li>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px;">Attempt to bypass any measures of the Services designed to prevent or restrict access to the Services, or any portion of the Services.</span></li>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px;">Copy or adapt the Services' software, including but not limited to Flash, PHP, HTML, JavaScript, or other code.</span></li>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px;">Except as permitted by applicable law, decipher, decompile, disassemble, or reverse engineer any of the software comprising or in any way making up a part of the Services.</span></li>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px;">Use the Services to advertise or offer to sell goods and services.</span></li>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px;">Sell or otherwise transfer your profile.</span></li>
  </ul>
  <div style="line-height: 1.5;"><br></div>

  <!-- 8. THIRD-PARTY WEBSITES AND CONTENT -->
  <div id="thirdparty" style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="heading_1"><strong><h2>8. THIRD-PARTY WEBSITES AND CONTENT</h2></strong></span></span>
  </div>

  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="body_text">The Services may contain (or you may be sent via the Services) links to other websites ("Third-Party Websites") as well as articles, photographs, text, graphics, pictures, designs, music, sound, video, information, applications, software, and other content or items belonging to or originating from third parties ("Third-Party Content"). Such Third-Party Websites and Third-Party Content are not investigated, monitored, or checked for accuracy, appropriateness, or completeness by us, and we are not responsible for any Third-Party Websites accessed through the Services or any Third-Party Content posted on, available through, or installed from the Services. Inclusion of, linking to, or permitting the use or installation of any Third-Party Websites or any Third-Party Content does not imply approval or endorsement thereof by us.</span></span>
  </div>
  <div style="line-height: 1.5;"><br></div>

  <!-- 9. SERVICES MANAGEMENT -->
  <div id="sitemanage" style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="heading_1"><strong><h2>9. SERVICES MANAGEMENT</h2></strong></span></span>
  </div>

  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="body_text">We reserve the right, but not the obligation, to: (1) monitor the Services for violations of these Legal Terms; (2) take appropriate legal action against anyone who, in our sole discretion, violates the law or these Legal Terms; (3) refuse, restrict access to, limit the availability of, or disable (to the extent technologically feasible) any of your contributions or any portion thereof; (4) in our sole discretion and without limitation, refuse, or remove from the Services or otherwise disable all files and content that are excessive in size or are in any way burdensome to our systems; and (5) otherwise manage the Services in a manner designed to protect our rights and property and to facilitate the proper functioning of the Services.</span></span>
  </div>
  <div style="line-height: 1.5;"><br></div>

  <!-- 10. PRIVACY POLICY -->
  <div id="ppyes" style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="heading_1"><strong><h2>10. PRIVACY POLICY</h2></strong></span></span>
  </div>

  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="body_text">We care about data privacy and security. Please review our Privacy Policy: <a href="https://usepaletta.io/privacy-policy" target="_blank" data-custom-class="link">https://usepaletta.io/privacy-policy</a>. By using the Services, you agree to be bound by our Privacy Policy, which is incorporated into these Legal Terms. Please be advised the Services are hosted in the United States. If you access the Services from any other region of the world with laws or other requirements governing personal data collection, use, or disclosure that differ from applicable laws in the United States, then through your continued use of the Services, you are transferring your data to the United States, and you expressly consent to have your data transferred to and processed in the United States.</span></span>
  </div>
  <div style="line-height: 1.5;"><br></div>

  <!-- 11. TERM AND TERMINATION -->
  <div id="terms" style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="heading_1"><strong><h2>11. TERM AND TERMINATION</h2></strong></span></span>
  </div>

  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="body_text">These Legal Terms shall remain in full force and effect while you use the Services. WITHOUT LIMITING ANY OTHER PROVISION OF THESE LEGAL TERMS, WE RESERVE THE RIGHT TO, IN OUR SOLE DISCRETION AND WITHOUT NOTICE OR LIABILITY, DENY ACCESS TO AND USE OF THE SERVICES (INCLUDING BLOCKING CERTAIN IP ADDRESSES), TO ANY PERSON FOR ANY REASON OR FOR NO REASON, INCLUDING WITHOUT LIMITATION FOR BREACH OF ANY REPRESENTATION, WARRANTY, OR COVENANT CONTAINED IN THESE LEGAL TERMS OR OF ANY APPLICABLE LAW OR REGULATION. WE MAY TERMINATE YOUR USE OR PARTICIPATION IN THE SERVICES OR DELETE YOUR ACCOUNT AND ANY CONTENT OR INFORMATION THAT YOU POSTED AT ANY TIME, WITHOUT WARNING, IN OUR SOLE DISCRETION.</span></span>
  </div>
  <div style="line-height: 1.5;"><br></div>

  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="body_text">If we terminate or suspend your account for any reason, you are prohibited from registering and creating a new account under your name, a fake or borrowed name, or the name of any third party, even if you may be acting on behalf of the third party. In addition to terminating or suspending your account, we reserve the right to take appropriate legal action, including without limitation pursuing civil, criminal, and injunctive redress.</span></span>
  </div>
  <div style="line-height: 1.5;"><br></div>

  <!-- 12. MODIFICATIONS AND INTERRUPTIONS -->
  <div id="modifications" style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="heading_1"><strong><h2>12. MODIFICATIONS AND INTERRUPTIONS</h2></strong></span></span>
  </div>

  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="body_text">We reserve the right to change, modify, or remove the contents of the Services at any time or for any reason at our sole discretion without notice. However, we have no obligation to update any information on our Services. We will not be liable to you or any third party for any modification, price change, suspension, or discontinuance of the Services.</span></span>
  </div>
  <div style="line-height: 1.5;"><br></div>

  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="body_text">We cannot guarantee the Services will be available at all times. We may experience hardware, software, or other problems or need to perform maintenance related to the Services, resulting in interruptions, delays, or errors. We reserve the right to change, revise, update, suspend, discontinue, or otherwise modify the Services at any time or for any reason without notice to you. You agree that we have no liability whatsoever for any loss, damage, or inconvenience caused by your inability to access or use the Services during any downtime or discontinuance of the Services.</span></span>
  </div>
  <div style="line-height: 1.5;"><br></div>

  <!-- 13. GOVERNING LAW -->
  <div id="law" style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="heading_1"><strong><h2>13. GOVERNING LAW</h2></strong></span></span>
  </div>

  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="body_text">These Legal Terms shall be governed by and defined following the laws of the United States. Andres Clavijo (doing business as Paletta) and yourself irrevocably consent that the courts of the United States shall have exclusive jurisdiction to resolve any dispute which may arise in connection with these Legal Terms.</span></span>
  </div>
  <div style="line-height: 1.5;"><br></div>

  <!-- 14. DISPUTE RESOLUTION -->
  <div id="disputes" style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="heading_1"><strong><h2>14. DISPUTE RESOLUTION</h2></strong></span></span>
  </div>

  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="heading_2"><strong><h3>Informal Negotiations</h3></strong></span></span>
  </div>

  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="body_text">To expedite resolution and control the cost of any dispute, controversy, or claim related to these Legal Terms (each a "Dispute" and collectively, the "Disputes") brought by either you or us (individually, a "Party" and collectively, the "Parties"), the Parties agree to first attempt to negotiate any Dispute (except those Disputes expressly provided below) informally for at least 30 days before initiating arbitration. Such informal negotiations commence upon written notice from one Party to the other Party.</span></span>
  </div>
  <div style="line-height: 1.5;"><br></div>

  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="heading_2"><strong><h3>Binding Arbitration</h3></strong></span></span>
  </div>

  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="body_text">Any dispute arising out of or in connection with these Legal Terms, including any question regarding its existence, validity, or termination, shall be referred to and finally resolved by the International Commercial Arbitration Court under the European Arbitration Chamber (Belgium, Brussels, Avenue Louise, 146) according to the Rules of this ICAC, which, as a result of referring to it, is considered as the part of this clause. The number of arbitrators shall be one (1). The seat, or legal place, of arbitration shall be Williamson County, Texas, United States. The language of the proceedings shall be English. The governing law of these Legal Terms shall be the substantive law of the United States.</span></span>
  </div>
  <div style="line-height: 1.5;"><br></div>

  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="body_text">If for any reason a Dispute proceeds in court rather than arbitration, the Dispute shall be commenced or prosecuted in the state and federal courts located in Williamson County, Texas, United States, and the Parties hereby consent to, and waive all defenses of lack of personal jurisdiction, and forum non conveniens with respect to venue and jurisdiction in such state and federal courts.</span></span>
  </div>
  <div style="line-height: 1.5;"><br></div>

  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="body_text">In no event shall any Dispute brought by either Party related in any way to the Services be commenced more than 1 year after the cause of action arose. If this provision is found to be illegal or unenforceable, then neither Party will elect to arbitrate any Dispute falling within that portion of this provision found to be illegal or unenforceable and such Dispute shall be decided by a court of competent jurisdiction within the courts listed for jurisdiction above, and the Parties agree to submit to the personal jurisdiction of that court.</span></span>
  </div>
  <div style="line-height: 1.5;"><br></div>

  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="body_text">The Parties agree that if Dispute resolution costs related to the arbitration are deemed excessive, Paletta will pay for any arbitration fees in excess of what would constitute a reasonable fee.</span></span>
  </div>
  <div style="line-height: 1.5;"><br></div>

  <!-- 15. CORRECTIONS -->
  <div id="corrections" style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="heading_1"><strong><h2>15. CORRECTIONS</h2></strong></span></span>
  </div>

  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="body_text">There may be information on the Services that contains typographical errors, inaccuracies, or omissions, including descriptions, pricing, availability, and various other information. We reserve the right to correct any errors, inaccuracies, or omissions and to change or update the information on the Services at any time, without prior notice.</span></span>
  </div>
  <div style="line-height: 1.5;"><br></div>

  <!-- 16. DISCLAIMER -->
  <div id="disclaimer" style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="heading_1"><strong><h2>16. DISCLAIMER</h2></strong></span></span>
  </div>

  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="body_text">THE SERVICES ARE PROVIDED ON AN AS-IS AND AS-AVAILABLE BASIS. YOU AGREE THAT YOUR USE OF THE SERVICES WILL BE AT YOUR SOLE RISK. TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, IN CONNECTION WITH THE SERVICES AND YOUR USE THEREOF, INCLUDING, WITHOUT LIMITATION, THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE MAKE NO WARRANTIES OR REPRESENTATIONS ABOUT THE ACCURACY OR COMPLETENESS OF THE SERVICES' CONTENT OR THE CONTENT OF ANY WEBSITES OR MOBILE APPLICATIONS LINKED TO THE SERVICES AND WE WILL ASSUME NO LIABILITY OR RESPONSIBILITY FOR ANY (1) ERRORS, MISTAKES, OR INACCURACIES OF CONTENT AND MATERIALS, (2) PERSONAL INJURY OR PROPERTY DAMAGE, OF ANY NATURE WHATSOEVER, RESULTING FROM YOUR ACCESS TO AND USE OF THE SERVICES, (3) ANY UNAUTHORIZED ACCESS TO OR USE OF OUR SECURE SERVERS AND/OR ANY AND ALL PERSONAL INFORMATION AND/OR FINANCIAL INFORMATION STORED THEREIN, (4) ANY INTERRUPTION OR CESSATION OF TRANSMISSION TO OR FROM THE SERVICES, (5) ANY BUGS, VIRUSES, TROJAN HORSES, OR THE LIKE WHICH MAY BE TRANSMITTED TO OR THROUGH THE SERVICES BY ANY THIRD PARTY, AND/OR (6) ANY ERRORS OR OMISSIONS IN ANY CONTENT AND MATERIALS OR FOR ANY LOSS OR DAMAGE OF ANY KIND INCURRED AS A RESULT OF THE USE OF ANY CONTENT POSTED, TRANSMITTED, OR OTHERWISE MADE AVAILABLE VIA THE SERVICES. WE DO NOT WARRANT, ENDORSE, GUARANTEE, OR ASSUME RESPONSIBILITY FOR ANY PRODUCT OR SERVICE ADVERTISED OR OFFERED BY A THIRD PARTY THROUGH THE SERVICES, ANY HYPERLINKED WEBSITE, OR ANY WEBSITE OR MOBILE APPLICATION FEATURED IN ANY BANNER OR OTHER ADVERTISING, AND WE WILL NOT BE A PARTY TO OR IN ANY WAY BE RESPONSIBLE FOR MONITORING ANY TRANSACTION BETWEEN YOU AND ANY THIRD-PARTY PROVIDERS OF PRODUCTS OR SERVICES.</span></span>
  </div>
  <div style="line-height: 1.5;"><br></div>

  <!-- 17. LIMITATIONS OF LIABILITY -->
  <div id="liability" style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="heading_1"><strong><h2>17. LIMITATIONS OF LIABILITY</h2></strong></span></span>
  </div>

  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="body_text">IN NO EVENT WILL WE OR OUR DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE TO YOU OR ANY THIRD PARTY FOR ANY DIRECT, INDIRECT, CONSEQUENTIAL, EXEMPLARY, INCIDENTAL, SPECIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFIT, LOST REVENUE, LOSS OF DATA, OR OTHER DAMAGES ARISING FROM YOUR USE OF THE SERVICES, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. NOTWITHSTANDING ANYTHING TO THE CONTRARY CONTAINED HEREIN, OUR LIABILITY TO YOU FOR ANY CAUSE WHATSOEVER AND REGARDLESS OF THE FORM OF THE ACTION, WILL AT ALL TIMES BE LIMITED TO THE AMOUNT PAID, IF ANY, BY YOU TO US DURING THE SIX (6) MONTH PERIOD PRIOR TO ANY CAUSE OF ACTION ARISING.</span></span>
  </div>
  <div style="line-height: 1.5;"><br></div>

  <!-- 18. INDEMNIFICATION -->
  <div id="indemnification" style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="heading_1"><strong><h2>18. INDEMNIFICATION</h2></strong></span></span>
  </div>

  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="body_text">You agree to defend, indemnify, and hold us harmless, including our subsidiaries, affiliates, and all of our respective officers, agents, partners, and employees, from and against any loss, damage, liability, claim, or demand, including reasonable attorneys' fees and expenses, made by any third party due to or arising out of: (1) use of the Services; (2) breach of these Legal Terms; (3) any breach of your representations and warranties set forth in these Legal Terms; (4) your violation of the rights of a third party, including but not limited to intellectual property rights; or (5) any overt harmful act toward any other user of the Services with whom you connected via the Services. Notwithstanding the foregoing, we reserve the right, at your expense, to assume the exclusive defense and control of any matter for which you are required to indemnify us, and you agree to cooperate, at your expense, with our defense of such claims. We will use reasonable efforts to notify you of any such claim, action, or proceeding which is subject to this indemnification upon becoming aware of it.</span></span>
  </div>
  <div style="line-height: 1.5;"><br></div>

  <!-- 19. USER DATA -->
  <div id="userdata" style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="heading_1"><strong><h2>19. USER DATA</h2></strong></span></span>
  </div>

  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="body_text">We will maintain certain data that you transmit to the Services for the purpose of managing the performance of the Services, as well as data relating to your use of the Services. Although we perform regular routine backups of data, you are solely responsible for all data that you transmit or that relates to any activity you have undertaken using the Services. You agree that we shall have no liability to you for any loss or corruption of any such data, and you hereby waive any right of action against us arising from any such loss or corruption of such data.</span></span>
  </div>
  <div style="line-height: 1.5;"><br></div>

  <!-- 20. ELECTRONIC COMMUNICATIONS -->
  <div id="electronic" style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="heading_1"><strong><h2>20. ELECTRONIC COMMUNICATIONS, TRANSACTIONS, AND SIGNATURES</h2></strong></span></span>
  </div>

  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="body_text">Visiting the Services, sending us emails, and completing online forms constitute electronic communications. You consent to receive electronic communications, and you agree that all agreements, notices, disclosures, and other communications we provide to you electronically, via email and on the Services, satisfy any legal requirement that such communication be in writing. YOU HEREBY AGREE TO THE USE OF ELECTRONIC SIGNATURES, CONTRACTS, ORDERS, AND OTHER RECORDS, AND TO ELECTRONIC DELIVERY OF NOTICES, POLICIES, AND RECORDS OF TRANSACTIONS INITIATED OR COMPLETED BY US OR VIA THE SERVICES.</span></span>
  </div>
  <div style="line-height: 1.5;"><br></div>

  <!-- 21. MISCELLANEOUS -->
  <div id="misc" style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="heading_1"><strong><h2>21. MISCELLANEOUS</h2></strong></span></span>
  </div>

  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="body_text">These Legal Terms and any policies or operating rules posted by us on the Services or in respect to the Services constitute the entire agreement and understanding between you and us. Our failure to exercise or enforce any right or provision of these Legal Terms shall not operate as a waiver of such right or provision. These Legal Terms operate to the fullest extent permissible by law. We may assign any or all of our rights and obligations to others at any time. We shall not be responsible or liable for any loss, damage, delay, or failure to act caused by any cause beyond our reasonable control. If any provision or part of a provision of these Legal Terms is determined to be unlawful, void, or unenforceable, that provision or part of the provision is deemed severable from these Legal Terms and does not affect the validity and enforceability of any remaining provisions. There is no joint venture, partnership, employment or agency relationship created between you and us as a result of these Legal Terms or use of the Services. You agree that these Legal Terms will not be construed against us by virtue of having drafted them. You hereby waive any and all defenses you may have based on the electronic form of these Legal Terms and the lack of signing by the parties hereto to execute these Legal Terms.</span></span>
  </div>
  <div style="line-height: 1.5;"><br></div>

  <!-- 22. FIGMA PLUGIN -->
  <div id="figmaplugin" style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="heading_1"><strong><h2>22. FIGMA PLUGIN</h2></strong></span></span>
  </div>

  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="body_text">The Paletta Figma Plugin ("Plugin") is subject to these Legal Terms in addition to Figma's Plugin Terms of Service. By installing or using the Plugin, you agree to the following additional terms:</span></span>
  </div>
  <div style="line-height: 1.5;"><br></div>

  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="body_text"><strong>Pro Features.</strong> Certain features within the Plugin, including but not limited to unlimited AI palette generation, advanced vision simulation modes, shade scale generation, and Tailwind configuration export, require an active Paletta Pro subscription ($5/month or $45/year). Free users may access a limited set of Plugin features as described on our website.</span></span>
  </div>
  <div style="line-height: 1.5;"><br></div>

  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="body_text"><strong>Authentication.</strong> The Plugin requires authentication via Google OAuth through your Paletta account. Your authentication session is stored locally using Figma's clientStorage API and may expire, requiring re-authentication. You are responsible for maintaining the security of your account credentials.</span></span>
  </div>
  <div style="line-height: 1.5;"><br></div>

  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="body_text"><strong>No Warranty.</strong> The Plugin is provided "as is" without warranty of any kind. We do not guarantee compatibility with all Figma features, plans, or future Figma updates. We are not responsible for any issues arising from changes to Figma's platform, API, or plugin infrastructure.</span></span>
  </div>
  <div style="line-height: 1.5;"><br></div>

  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="body_text"><strong>Modifications and Discontinuation.</strong> We reserve the right to modify, suspend, or discontinue Plugin functionality at any time, with or without notice. We shall not be liable to you or any third party for any modification, suspension, or discontinuation of the Plugin.</span></span>
  </div>
  <div style="line-height: 1.5;"><br></div>

  <!-- 23. CONTACT US -->
  <div id="contact" style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="heading_1"><strong><h2>23. CONTACT US</h2></strong></span></span>
  </div>

  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="body_text">In order to resolve a complaint regarding the Services or to receive further information regarding use of the Services, please contact us at:</span></span>
  </div>
  <div style="line-height: 1.5;"><br></div>

  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="body_text"><strong>Andres Clavijo (doing business as Paletta)</strong></span></span>
  </div>
  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="body_text">2108 Ariella Dr</span></span>
  </div>
  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="body_text">Cedar Park, TX 78613</span></span>
  </div>
  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="body_text">United States</span></span>
  </div>
  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="body_text"><a href="mailto:hello@usepaletta.io" data-custom-class="link">hello@usepaletta.io</a></span></span>
  </div>

</div>
`

export default function TermsOfService() {
  useEffect(() => {
    window.scrollTo(0, 0)
    document.title = 'Terms of Service — Paletta'
    return () => { document.title = 'Paletta — Free Color Palette Generator' }
  }, [])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAFAF8' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px 64px' }}>
        <nav style={{ marginBottom: 24 }}>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              color: '#6C47FF',
              fontSize: 14,
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
            Back to Paletta
          </Link>
        </nav>
        <div
          className="legal-content"
          dangerouslySetInnerHTML={{ __html: CONTENT }}
        />
      </div>
    </div>
  )
}
