import { useState } from 'react';
import React from 'react';
import './contact.css';
import emailjs from 'emailjs-com';
import mail_icon from '../../assets/mail_icon.svg';
import call_icon from '../../assets/call_icon.svg';
import location_icon from '../../assets/location_icon.svg';
import Title from '../Title'

const Contact = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [mobile, setMobile] = useState("");
    const [message, setMessage] = useState("");
    const [status, setStatus] = useState("");

    const onSubmit = async (event) => {
        event.preventDefault();
        setStatus("Sending...");

        const templateParams = {
            name: name,
            email: email,
            mobile: mobile,
            message: message
        };

        emailjs.send(
            'service_jhhgmyg',
            'template_lwxiuur',
            templateParams,
            'VKLxjFxDmwgzELCcT'
        ).then(
            (response) => {
                console.log("Email sent!", response.status, response.text);
                setStatus("Message sent successfully");
                setName("");
                setEmail("");
                setMobile("");
                setMessage("");
            },
            (error) => {
                console.error("Email failed:", error);
                setStatus("Failed to send message");
            }
        );
    };

    return (
        <div className="contact" id='contacts'>
            <Title title="Get In Touch" />
            <div className="contact-content">
                <div className="contact-info">
                    <h1 className='contact-info-title'>Let's Talk</h1>
                    <p>
                        I'm here to help you with any questions or concerns you may have. Whether you need assistance with a project, have a question about my work, or just want to chat, feel free to reach out to me.
                    </p>
                    <div className="contact-info-item">
                        <img src={mail_icon} alt="Mail Icon" />
                        <p>pragneyshdekate@gmail.com</p>
                    </div>
                    <div className="contact-info-item">
                        <img src={call_icon} alt="Call Icon" />
                        <p>+91 9714775746</p>
                    </div>
                    <div className="contact-info-item">
                        <img src={location_icon} alt="Location Icon" />
                        <p>
                            K-302 Prakruti Residency, 
                            Mahadev Nagar Tekara,
                            Vastral, Ahmedabad,
                            Gujarat, India 302418.
                        </p>
                    </div>
                </div>
                <div className="contact-form">
                    <form onSubmit={onSubmit} className="contact-form">
                        <label htmlFor="name">Name</label>
                        <input type="text" name="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" required />

                        <label htmlFor="email">Email</label>
                        <input type="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />

                        <label htmlFor="mobile">Mobile Number</label>
                        <input type="tel" name="mobile" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="Mobile Number" required />

                        <label htmlFor="message">Message</label>
                        <textarea name="message" id="message" cols="30" rows="10" placeholder="Message" value={message} onChange={(e) => setMessage(e.target.value)} required />

                        <button type="submit">Submit Now</button>
                        {status && <p style={{ marginTop: "10px", color: status.includes("success") ? "green" : "red" }}>{status}</p>}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Contact;
