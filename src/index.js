import { Hono } from 'hono'
import { fakerZH_CN, fakerEN_US } from '@faker-js/faker'

const app = new Hono()

function generateIdentity(lang) {
  const f = lang === 'en' ? fakerEN_US : fakerZH_CN;
  const sex = f.person.sexType();
  const firstName = f.person.firstName(sex);
  const lastName = f.person.lastName();
  
  return {
    personal: {
      fullName: lang === 'en' ? `${firstName} ${lastName}` : `${lastName}${firstName}`,
      gender: sex === 'female' ? (lang === 'en' ? 'Female' : '女性') : (lang === 'en' ? 'Male' : '男性'),
      birthday: f.date.birthdate({ min: 18, max: 65, mode: 'age' }).toISOString().split('T')[0],
      phone: f.phone.number(),
      email: f.internet.email({ firstName, lastName }),
      avatar: f.image.avatar(),
      job: f.person.jobTitle()
    },
    location: {
      address: f.location.streetAddress(true),
      city: f.location.city(),
      state: f.location.state(),
      zipCode: f.location.zipCode(),
      country: lang === 'en' ? 'United States' : '中国'
    },
    finance: {
      cc: f.finance.creditCardNumber(),
      cvv: f.finance.creditCardCVV(),
      iban: f.finance.iban()
    },
    internet: {
      password: f.internet.password(),
      ip: f.internet.ipv4()
    }
  };
}

app.get('/', (c) => {
  const lang = c.req.query('lang') || 'cn';
  const data = generateIdentity(lang);
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Fake ID Generator</title>
      <style>
        body { background: #f0f2f5; font-family: sans-serif; display: flex; justify-content: center; padding: 20px; }
        .card { background: white; width: 100%; max-width: 500px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); overflow: hidden; }
        .top { background: #0052cc; padding: 20px; color: white; display: flex; align-items: center; }
        .avatar { width: 70px; height: 70px; border-radius: 50%; border: 3px solid white; margin-right: 15px; background: #ddd; }
        .info { padding: 20px; }
        .row { border-bottom: 1px solid #eee; padding: 10px 0; }
        .label { color: #888; font-size: 12px; display: block; }
        .val { font-size: 16px; color: #333; font-family: monospace; }
        .btn-group { padding: 20px; display: flex; gap: 10px; }
        a { flex: 1; text-align: center; padding: 10px; border-radius: 5px; text-decoration: none; font-weight: bold; }
        .btn-cn { background: #0052cc; color: white; }
        .btn-en { background: #e0e0e0; color: #333; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="top">
          <img src="${data.personal.avatar}" class="avatar">
          <div>
            <h2 style="margin:0">${data.personal.fullName}</h2>
            <small>${data.personal.job}</small>
          </div>
        </div>
        <div class="info">
          <div class="row"><span class="label">性别 / Gender</span><span class="val">${data.personal.gender}</span></div>
          <div class="row"><span class="label">生日 / Birthday</span><span class="val">${data.personal.birthday}</span></div>
          <div class="row"><span class="label">地址 / Address</span><span class="val">${data.location.state}, ${data.location.city}, ${data.location.address}</span></div>
          <div class="row"><span class="label">信用卡 / Credit Card</span><span class="val">${data.finance.cc}</span></div>
        </div>
        <div class="btn-group">
          <a href="/?lang=cn" class="btn-cn">生成中文</a>
          <a href="/?lang=en" class="btn-en">US Identity</a>
        </div>
      </div>
    </body>
    </html>
  `;
  return c.html(html);
});

export default app;
