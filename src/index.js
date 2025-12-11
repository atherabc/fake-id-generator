import { Hono } from 'hono'
import { fakerEN_US } from '@faker-js/faker'

const app = new Hono()

// --- 1. 后端数据：全美50州 + DC (无重复键名，严格校验) ---
const US_STATE_DATA = {
  // === 免税州 (Tax Free) ===
  'MT': { name: 'Montana', zipPrefix: ['59'], areaCodes: ['406'] },
  'DE': { name: 'Delaware', zipPrefix: ['19'], areaCodes: ['302'] },
  'OR': { name: 'Oregon', zipPrefix: ['97'], areaCodes: ['503', '541', '971'] },
  'NH': { name: 'New Hampshire', zipPrefix: ['03'], areaCodes: ['603'] },
  'AK': { name: 'Alaska', zipPrefix: ['99'], areaCodes: ['907'] },

  // === 其他州 (A-Z, 已移除上述5个免税州以避免键名重复) ===
  'AL': { name: 'Alabama', zipPrefix: ['35', '36'], areaCodes: ['205', '251', '334', '256'] },
  'AZ': { name: 'Arizona', zipPrefix: ['85', '86'], areaCodes: ['602', '520', '480', '623'] },
  'AR': { name: 'Arkansas', zipPrefix: ['71', '72'], areaCodes: ['501', '479', '870'] },
  'CA': { name: 'California', zipPrefix: ['90', '91', '92', '93', '94', '95'], areaCodes: ['213', '310', '415', '626', '909', '858', '619'] },
  'CO': { name: 'Colorado', zipPrefix: ['80', '81'], areaCodes: ['303', '719', '970'] },
  'CT': { name: 'Connecticut', zipPrefix: ['06'], areaCodes: ['203', '860'] },
  'DC': { name: 'District of Columbia', zipPrefix: ['20'], areaCodes: ['202'] },
  'FL': { name: 'Florida', zipPrefix: ['32', '33', '34'], areaCodes: ['305', '407', '786', '813', '904'] },
  'GA': { name: 'Georgia', zipPrefix: ['30', '31'], areaCodes: ['404', '770', '912', '706'] },
  'HI': { name: 'Hawaii', zipPrefix: ['96'], areaCodes: ['808'] },
  'ID': { name: 'Idaho', zipPrefix: ['83'], areaCodes: ['208'] },
  'IL': { name: 'Illinois', zipPrefix: ['60', '61', '62'], areaCodes: ['312', '773', '630', '217'] },
  'IN': { name: 'Indiana', zipPrefix: ['46', '47'], areaCodes: ['317', '219', '812', '574'] },
  'IA': { name: 'Iowa', zipPrefix: ['50', '51', '52'], areaCodes: ['515', '319', '563'] },
  'KS': { name: 'Kansas', zipPrefix: ['66', '67'], areaCodes: ['785', '316', '913'] },
  'KY': { name: 'Kentucky', zipPrefix: ['40', '41', '42'], areaCodes: ['502', '859', '270'] },
  'LA': { name: 'Louisiana', zipPrefix: ['70', '71'], areaCodes: ['504', '225', '318', '337'] },
  'ME': { name: 'Maine', zipPrefix: ['04'], areaCodes: ['207'] },
  'MD': { name: 'Maryland', zipPrefix: ['20', '21'], areaCodes: ['410', '301', '240'] },
  'MA': { name: 'Massachusetts', zipPrefix: ['01', '02'], areaCodes: ['617', '508', '413', '978'] },
  'MI': { name: 'Michigan', zipPrefix: ['48', '49'], areaCodes: ['313', '248', '517', '616'] },
  'MN': { name: 'Minnesota', zipPrefix: ['55', '56'], areaCodes: ['612', '651', '218', '507'] },
  'MS': { name: 'Mississippi', zipPrefix: ['38', '39'], areaCodes: ['601', '662', '228'] },
  'MO': { name: 'Missouri', zipPrefix: ['63', '64', '65'], areaCodes: ['314', '816', '417', '573'] },
  // MT removed here (already at top)
  'NE': { name: 'Nebraska', zipPrefix: ['68', '69'], areaCodes: ['402', '308'] },
  'NV': { name: 'Nevada', zipPrefix: ['88', '89'], areaCodes: ['702', '775'] },
  // NH removed here (already at top)
  'NJ': { name: 'New Jersey', zipPrefix: ['07', '08'], areaCodes: ['201', '732', '609', '856'] },
  'NM': { name: 'New Mexico', zipPrefix: ['87', '88'], areaCodes: ['505', '575'] },
  'NY': { name: 'New York', zipPrefix: ['10', '11', '12', '13', '14'], areaCodes: ['212', '718', '917', '646', '315'] },
  'NC': { name: 'North Carolina', zipPrefix: ['27', '28'], areaCodes: ['919', '704', '336', '252'] },
  'ND': { name: 'North Dakota', zipPrefix: ['58'], areaCodes: ['701'] },
  'OH': { name: 'Ohio', zipPrefix: ['43', '44', '45'], areaCodes: ['216', '614', '513', '937'] },
  'OK': { name: 'Oklahoma', zipPrefix: ['73', '74'], areaCodes: ['405', '918', '580'] },
  // OR removed here (already at top)
  'PA': { name: 'Pennsylvania', zipPrefix: ['15', '16', '17', '18', '19'], areaCodes: ['215', '412', '717', '610'] },
  'RI': { name: 'Rhode Island', zipPrefix: ['02'], areaCodes: ['401'] },
  'SC': { name: 'South Carolina', zipPrefix: ['29'], areaCodes: ['803', '843', '864'] },
  'SD': { name: 'South Dakota', zipPrefix: ['57'], areaCodes: ['605'] },
  'TN': { name: 'Tennessee', zipPrefix: ['37', '38'], areaCodes: ['615', '901', '865', '423'] },
  'TX': { name: 'Texas', zipPrefix: ['75', '76', '77', '78', '79'], areaCodes: ['214', '512', '713', '817', '915'] },
  'UT': { name: 'Utah', zipPrefix: ['84'], areaCodes: ['801', '435'] },
  'VT': { name: 'Vermont', zipPrefix: ['05'], areaCodes: ['802'] },
  'VA': { name: 'Virginia', zipPrefix: ['22', '23', '24'], areaCodes: ['703', '804', '757', '540'] },
  'WA': { name: 'Washington', zipPrefix: ['98', '99'], areaCodes: ['206', '509', '425', '253'] },
  'WV': { name: 'West Virginia', zipPrefix: ['24', '25', '26'], areaCodes: ['304'] },
  'WI': { name: 'Wisconsin', zipPrefix: ['53', '54'], areaCodes: ['414', '608', '920', '715'] },
  'WY': { name: 'Wyoming', zipPrefix: ['82'], areaCodes: ['307'] }
};

// --- 2. 后端逻辑：生成身份 ---
function generateSpecificIdentity(params) {
  const { region, city, gender, age } = params;
  const f = fakerEN_US; // 强制美国数据
  
  const idName = "社会安全码 (SSN)";
  const idValue = f.string.numeric(3) + "-" + f.string.numeric(2) + "-" + f.string.numeric(4);

  const sexType = gender === 'female' ? 'female' : 'male';
  
  // 1. 州/省名称处理
  let finalStateCode = region;
  let finalStateName = "";
  
  if (region && US_STATE_DATA[region]) {
    finalStateName = US_STATE_DATA[region].name;
  } else {
     // 随机
     const keys = Object.keys(US_STATE_DATA);
     finalStateCode = keys[Math.floor(Math.random() * keys.length)];
     finalStateName = US_STATE_DATA[finalStateCode].name;
  }

  // 2. 城市处理 (清洗: "Helena - 海伦娜 [首府]" -> "Helena")
  let finalCityRaw = city || f.location.city();
  let finalCity = finalCityRaw.split(' - ')[0].replace('[首府]', '').replace('[Capital]', '').trim();

  // 3. 电话处理
  let finalPhone = "";
  if (US_STATE_DATA[finalStateCode]) {
    const codes = US_STATE_DATA[finalStateCode].areaCodes;
    const areaCode = codes[Math.floor(Math.random() * codes.length)];
    const part2 = f.string.numeric(3);
    const part3 = f.string.numeric(4);
    finalPhone = `${areaCode}-${part2}-${part3}`; 
  } else {
    finalPhone = f.phone.number();
  }

  // 4. 邮编处理
  let finalZip = "";
  if (US_STATE_DATA[finalStateCode]) {
    const prefixes = US_STATE_DATA[finalStateCode].zipPrefix;
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = f.string.numeric(3); 
    finalZip = `${prefix}${suffix}`; 
  } else {
    finalZip = f.location.zipCode('#####'); 
  }

  // 5. 完整地址
  const finalStreet = f.location.streetAddress(false);
  const fullAddress = `${finalStreet} ${finalCity}, ${finalStateCode} ${finalZip}`;
  
  // 6. 信用卡逻辑 (严格)
  const cardTypes = ['Visa', 'MasterCard', 'American Express'];
  const selectedCardType = f.helpers.arrayElement(cardTypes);
  
  let providerName = '';
  if (selectedCardType === 'Visa') providerName = 'visa'; // 16位 4开头
  else if (selectedCardType === 'MasterCard') providerName = 'mastercard'; // 16位 5开头
  else providerName = 'amex'; // 15位 3开头

  let ccNum = f.finance.creditCardNumber(providerName); 
  ccNum = ccNum.replace(/-/g, ''); 
  
  const birthDate = f.date.birthdate({ mode: 'age', min: parseInt(age), max: parseInt(age) });

  return {
    personal: {
      fullName: `${f.person.firstName(sexType)} ${f.person.lastName()}`,
      gender: gender === 'female' ? 'Female' : 'Male',
      age: age,
      birthday: birthDate.toISOString().split('T')[0],
      phone: finalPhone,
      avatar: f.image.avatar(),
    },
    location: {
      country: 'US',
      stateFull: finalStateName,
      stateCode: finalStateCode,
      city: finalCity,
      street: finalStreet,
      zipCode: finalZip,
      formatted: fullAddress
    },
    ids: {
      name: idName,
      value: idValue
    },
    finance: {
      ccNumber: ccNum,
      ccType: selectedCardType,
      ccCVV: f.finance.creditCardCVV(),
      ccExp: f.date.future({ years: 5 }).toISOString().substring(0, 7).replace('-', '/')
    }
  };
}

// --- 3. API 接口 ---
app.get('/api/generate', (c) => {
  const query = c.req.query();
  const params = {
    country: 'US',
    region: query.region || '',
    city: query.city || '',
    gender: query.gender || 'male',
    age: query.age || 25
  };
  const data = generateSpecificIdentity(params);
  return c.json(data);
});

// --- 4. 前端页面 ---
app.get('/', (c) => {
  const html = `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>US Identity Generator</title>
      <style>
        body { font-family: "Segoe UI", "Microsoft YaHei", sans-serif; background: #eef2f6; margin: 0; padding: 20px; display: flex; justify-content: center; }
        .container { display: flex; flex-direction: column; gap: 20px; width: 100%; max-width: 850px; }
        
        .controls { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #e0e0e0;}
        .row { display: flex; gap: 15px; flex-wrap: wrap; margin-bottom: 15px; }
        .group { flex: 1; min-width: 150px; }
        label { display: block; font-size: 13px; color: #555; margin-bottom: 6px; font-weight: 600;}
        select, input { width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 6px; font-size: 14px; background: #fafafa; }
        
        button { background: #0070f3; color: white; border: none; padding: 14px; border-radius: 6px; cursor: pointer; font-weight: bold; width: 100%; font-size: 16px; transition: 0.2s; margin-top: 10px; }
        button:hover { background: #005bb5; }

        .card { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08); display: none; animation: fadeIn 0.4s ease; border: 1px solid #eaeaea;}
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        .card.active { display: block; }
        .header { background: #f8f9fa; padding: 25px; display: flex; align-items: center; border-bottom: 1px solid #eee; }
        .avatar { width: 80px; height: 80px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.1); margin-right: 20px; background: #ddd; object-fit: cover; }
        
        .info-grid { padding: 25px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
        @media(max-width: 600px) { .info-grid { grid-template-columns: 1fr; } }
        .full-width { grid-column: span 2; }
        @media(max-width: 600px) { .full-width { grid-column: span 1; } }

        .field label { color: #888; font-size: 11px; text-transform: uppercase; margin-bottom: 4px; display: flex; justify-content: space-between; }
        .field div { font-family: "Consolas", "Monaco", monospace; font-size: 15px; color: #333; font-weight: 600; border-bottom: 1px solid #f0f0f0; padding-bottom: 5px; min-height: 20px; }
        
        .highlight { color: #0070f3 !important; font-size: 16px !important; }
    
        .cc-box { background: linear-gradient(135deg, #2c3e50, #4ca1af); color: white; padding: 15px; border-radius: 8px; margin-top: 5px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .cc-box div { color: white; border: none; text-shadow: 0 1px 2px rgba(0,0,0,0.2); letter-spacing: 1px; }
        .cc-row { display: flex; gap: 20px; margin-top: 10px; }
        .cc-label { font-size: 10px; opacity: 0.8; display: block; margin-bottom: 2px; text-transform: uppercase; }
        .cc-val { font-size: 14px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="controls">
          <div class="row">
            <div class="group">
              <label>国家 / Country</label>
              <select id="country" disabled>
                <option value="US">美国 (United States)</option>
              </select>
            </div>
            <div class="group">
              <label>州 / State (免税州优先)</label>
              <select id="region" onchange="updateCities()">
                <option value="">-- 随机 / Random --</option>
              </select>
            </div>
            <div class="group">
              <label>城市 / City</label>
              <select id="city">
