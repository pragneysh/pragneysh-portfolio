import React from 'react'
import './about.css'
import profile_img from '../../assets/Pragneysh.png'    
import Title from '../Title'
import skill_data from '../../assets/skill_data'


const About = () => {
  return (
    <div className='about container' id='about'>
        <Title title="About Me" />
        <div className="about-content">
            <div className="about-left sm-none">
                <img src={profile_img} alt="Theme Pattern" />
            </div>
            <div className="about-right">
                <div className="about-para">
                    <p>Motivated and detail-oriented Full Stack Developer with a passion for building beautiful, functional, and responsive web applications.</p>
                    <p>Strong foundation in Python, Django, HTML/CSS, JavaScript, jQuery, and modern frontend frameworks like Bootstrap and Tailwind CSS.</p>
                    <p>Skilled in both frontend and backend development, with hands-on experience gained through multiple internships and real-world projects.</p>
                    <p>Committed to staying updated with the latest web technologies to deliver efficient and user-friendly solutions.</p>   
                </div>
            </div>
        </div>
        <div className="about-achievements">
            {skill_data.map((skill, index) => (
                <div className="about-achievement" key={index}>
                    <img src={skill.skill_img} alt={skill.skill_name} />
                    <h3>{skill.skill_name}</h3>
                </div>
            ))}
        </div>
        <div className="about-achievements">
            <div className="about-achievement">
                <h1>1+</h1>
                <p>Years of Experience</p>
            </div>
            <hr />
            <div className="about-achievement">
                <h1>5+</h1>
                <p>Projects Completed</p>
            </div>
            <hr />
            <div className="about-achievement">
                <h1>2+</h1>
                <p>Happy Clients</p>
            </div>
            <hr />
        </div>
    </div>
  )
}

export default About