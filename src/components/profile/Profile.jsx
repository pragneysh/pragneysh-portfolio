
import React from 'react'
import profile_img from '../../assets/Pragneysh.png'
import CV from '../../assets/Pragneysh_CV.pdf'
import './profile.css'
import AnchorLink from 'react-anchor-link-smooth-scroll';


const Profile = () => {
  return (
    <div className="profile" id='home'>
        <img src={profile_img} alt="Pragneysh Dekate" />
        <h1><samp>I'm Pragneysh Dekate,</samp> <br className='sm-block d-none' /> Full Stack Developer</h1>
        <p>
            I'm a Full Stack Developer with a passion for creating beautiful and functional websites. I have a strong background in web development and a deep understanding of the latest technologies.
        </p>
        <div className='profile-buttons'>
        <AnchorLink className="nav-link" offset={50} href="#contacts"><button className='connect-button'>Connect With Me</button></AnchorLink>
            <div className="download-button-wrapper">
                <a href={CV} download="Pragneysh_Dekate_CV.pdf">
                    <button className="download-button"><span>Download CV</span></button>
                </a>
            </div>
        </div>
    </div>
  )
}

export default Profile