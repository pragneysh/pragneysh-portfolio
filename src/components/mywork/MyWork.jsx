import React from 'react'
import './mywork.css'
import mywork_data from '../../assets/mywork_data.js'
import Title from '../Title'

const MyWork = () => {
  return (
    <div className="myworks" id='portfolio'>
        <Title title="My Work" />
        <div className="mywork-content">
            {mywork_data.map((mywork, index) => (
                <div className="mywork" key={index}>
                    {/* <h2>{mywork.w_name}</h2> */}    
                    <img src={mywork.w_img} alt="Theme Pattern" />
                </div>
            ))}
        </div>
        <div className="mywork-button-wrapper">
            <button className="mywork-button"><span>Show More <i className="fa-solid fa-arrow-right"></i></span></button>
        </div>
    </div>
  )
}

export default MyWork