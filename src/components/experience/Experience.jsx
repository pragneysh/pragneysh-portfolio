import React from 'react'
import './experience.css'
import Experience_Data from '../../assets/Experience_Data.js'
import Title from '../Title.jsx'

const Experience = () => {
  return (
    <div>
        <div className="experiences" id='experiences'>
            <Title title="My Experiences" />
            <div className="experiences-content">
                {Experience_Data.map((experience, index) => (
                    <div className="experience" key={index}>
                        <h2>{experience.e_no}.</h2>
                        <h2>{experience.e_name}</h2>
                        <div className="experience-company">
                            <h3><b>{experience.e_company}</b></h3>
                            <h3>{experience.e_duration}</h3>
                        </div>
                        <p className="experience-desc">{experience.e_desc.length > 100 ? experience.e_desc.slice(0, 100) + '...' : experience.e_desc}</p>
                        <button className="read-more" onClick={(event) => {
                            const p = event.target.parentNode.querySelector('.experience-desc');
                            if (p.innerText.endsWith('...')) {
                                p.innerText = experience.e_desc;
                            } else {
                                p.innerText = experience.e_desc.slice(0, 100) + '...';
                            }
                        }}>
                            Read More
                            <i className="fa-solid fa-arrow-right"></i>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    </div>
  )
}

export default Experience