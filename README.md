# Golf Loft Calculator

A lightweight, interactive tool for estimating dynamic loft and carry distance based on swing speed, club selection, and loft adjustments. 
Designed for golfers who want a quick, data-informed way to assess performance without relying on launch monitor hardware.

## 🔧 Features

- Club selector populated from structured JSON data
- Swing speed input with validation (60–130 mph)
- Loft override input for custom club setups
- Scratch golfer carry estimation with loft-based speed adjustment
- Performance ratio calculation relative to baseline carry
- Dynamic feedback and warnings for unusual loft/carry combinations

## 📁 Project Structure
/index.html       
	→ Main UI and layout /style.css        
	→ Styling and responsive layout /script.js        
	→ Core logic and interactivity /data/golfdata.json 
	→ Club data, metrics, and carry tables


## 📊 Calculation Logic

- **Carry Estimation**: Uses interpolation between known swing speeds
- **Loft Adjustment**: Modifies scratch golfer swing speed based on loft delta
- **Performance Ratio**: Compares user carry to baseline and scratch benchmarks
- **Dynamic Loft Estimation**: Calculates shaft lean and dynamic loft based on performance

## 🚀 Getting Started

1. Clone or download the repository
2. Ensure `golfdata.json` is located in `/data/`
3. Open `index.html` in a browser
4. Adjust swing speed and loft to see real-time feedback

## 🧠 Notes

- The tool is designed for educational and estimation purposes only
- Loft-based swing speed adjustment is a simplified model—values may vary in real-world conditions
- Feedback and contributions are welcome!

## 📜 License

This project is released under the MIT License.

## 🙋‍♂️ Author

Created by John Pascoe – Chartered Engineer, Data analyst and (bad) golfer.  
For questions, feedback, or bug reports, feel free to reach out via the site or GitHub.
