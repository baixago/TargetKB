* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: Arial, sans-serif;
  background: #f6f8fc;
  color: #172033;
  line-height: 1.5;
}

header {
  background: #fff;
  border-bottom: 1px solid #e5e9f0;
  padding: 16px 5%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  color: #1769e0;
  font-size: 21px;
  font-weight: bold;
}

nav {
  display: flex;
  gap: 16px;
}

nav a {
  color: #4d596b;
  text-decoration: none;
  font-size: 14px;
}

.hero {
  max-width: 850px;
  margin: auto;
  padding: 55px 20px 30px;
  text-align: center;
}

.tagline {
  color: #1769e0;
  font-size: 12px;
  font-weight: bold;
  letter-spacing: 1px;
  margin-bottom: 12px;
}

h1 {
  font-size: clamp(30px, 7vw, 52px);
  line-height: 1.1;
  margin-bottom: 18px;
}

.hero p {
  max-width: 620px;
  margin: auto;
  color: #687386;
}

.compressor {
  max-width: 700px;
  margin: 20px auto 65px;
  padding: 0 20px;
}

.card {
  background: #fff;
  border: 1px solid #e1e7f0;
  border-radius: 18px;
  padding: 25px;
  box-shadow: 0 12px 30px rgba(25, 45, 80, 0.07);
}

.section-title {
  text-align: center;
  color: #1769e0;
  font-size: 13px;
  font-weight: bold;
  letter-spacing: 1px;
  margin-bottom: 20px;
}

.drop-zone {
  text-align: center;
  border: 2px dashed #b7c8df;
  border-radius: 14px;
  padding: 35px 15px;
  background: #f9fbff;
}

.drop-zone h2 {
  font-size: 20px;
  margin-bottom: 8px;
}

.drop-zone p {
  color: #748095;
  font-size: 14px;
  margin-bottom: 18px;
}

input[type="file"] {
  display: none;
}

.choose-btn,
.compress-btn,
.download-btn {
  display: inline-block;
  border: 0;
  border-radius: 8px;
  padding: 13px 20px;
  color: white;
  font-weight: bold;
  cursor: pointer;
  text-decoration: none;
  font-size: 14px;
}

.choose-btn,
.compress-btn {
  background: #1769e0;
}

.choose-btn:hover,
.compress-btn:hover {
  background: #0d54bc;
}

#fileName {
  color: #687386;
  font-size: 13px;
  margin-top: 15px;
}

.size-title {
  text-align: center;
  font-weight: bold;
  margin: 25px 0 12px;
}

.size-options {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 9px;
}

.size-options button {
  background: white;
  color: #344054;
  border: 1px solid #cbd6e5;
  border-radius: 8px;
  padding: 11px 17px;
  cursor: pointer;
}

.size-options button.active {
  background: #eaf2ff;
  border-color: #1769e0;
  color: #1769e0;
  font-weight: bold;
}

.compress-btn {
  width: 100%;
  margin-top: 22px;
  font-size: 16px;
}

#result {
  display: none;
  text-align: center;
  border-top: 1px solid #e5e9f0;
  margin-top: 24px;
  padding-top: 22px;
}

#preview {
  display: block;
  max-width: 100%;
  max-height: 250px;
  margin: 0 auto 13px;
  border-radius: 10px;
}

#resultText {
  color: #5d6a7e;
  font-size: 14px;
  margin-bottom: 15px;
}

.download-btn {
  background: #159765;
}

.steps {
  max-width: 950px;
  margin: 0 auto 60px;
  padding: 0 20px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.step {
  background: white;
  border: 1px solid #e1e7f0;
  border-radius: 13px;
  padding: 22px;
}

.step-number {
  color: #1769e0;
  font-size: 13px;
  font-weight: bold;
}

.step h3 {
  margin: 7px 0;
}

.step p {
  color: #687386;
  font-size: 14px;
}

.privacy {
  max-width: 850px;
  margin: 0 auto 60px;
  padding: 28px 20px;
  background: #eaf3ff;
  border-radius: 15px;
  text-align: center;
}

.privacy h2 {
  margin-bottom: 8px;
  font-size: 22px;
}

.privacy p {
  color: #536174;
}

footer {
  padding: 25px 15px;
  text-align: center;
  background: #172033;
  color: #c8d0dc;
  font-size: 13px;
}

footer a {
  color: white;
  text-decoration: none;
  margin: 0 7px;
}

@media (max-width: 650px) {
  header {
    padding: 15px 18px;
    align-items: flex-start;
  }

  nav {
    flex-direction: column;
    gap: 5px;
    text-align: right;
  }

  .hero {
    padding-top: 42px;
  }

  .card {
    padding: 17px;
  }

  .steps {
    grid-template-columns: 1fr;
  }
}
