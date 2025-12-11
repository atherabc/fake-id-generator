import { Hono } from 'hono'
import { fakerZH_CN, fakerEN_US, fakerJA, fakerDE } from '@faker-js/faker'

const app = new Hono()

// --- 1. 后端数据：州规则 (用于生成精准的区号和邮编) ---
const US_STATE_DATA = {
  'OR': { name: 'Oregon', zipPrefix: ['97'], areaCodes: ['503', '541', '971'] },
  'CA': { name: 'California', zipPrefix: ['90', '91', '92', '93', '94', '95'], areaCodes: ['213', '310', '415', '626', '909'] },
  'NY': { name: 'New York', zipPrefix: ['10', '11', '12', '13', '14'], areaCodes: ['212', '718', '917', '646'] },
  'TX': { name: 'Texas', zipPrefix: ['75', '76', '77', '78', '79'], areaCodes: ['214', '512', '713', '817'] },
  'FL': { name: 'Florida', zipPrefix: ['32', '33', '34'], areaCodes: ['305', '407', '786', '813'] },
  'MT': { name: 'Montana', zipPrefix: ['59'], areaCodes: ['406'] },
  'DE': { name: 'Delaware', zipPrefix: ['19'], areaCodes: ['302'] }
};

// --- 2. 后端逻辑：生成身份 ---
function generateSpecificIdentity(params) {
  const { country, region, city, gender, age } = params;
  
  let f;
  let idName = "ID Number";
  let idValue = "";
  let fullAddress = "";
  let finalStateName = region; 
  let finalPhone = "";
  let finalZip = "";
  
  // 初始化 Faker
  switch (country) {
    case 'CN': f = fakerZH_CN; break;
    case 'JP': f = fakerJA; break;
    case 'DE': f = fakerDE; break;
    case 'US': default: f = fakerEN_US; break;
  }

  // --- ID 生成逻辑 ---
  if (country === 'CN') {
    idName = "居民身份证 (ID Card)";
    const cnYear = new Date().getFullYear() - age;
    idValue = `110105${cnYear}0101123X`;
  } else if (country === 'JP') {
    idName = "个人编号 (My Number)";
    idValue = f.phone.number('####-####-####');
  } else if (country === 'DE') {
    idName = "身份证号 (Ausweisnummer)";
    idValue = f.string.alphanumeric(9).toUpperCase();
  } else {
    // 美国默认
    idName = "社会安全码 (SSN)";
    idValue = f.string.numeric(3) + "-" + f.string.numeric(2) + "-" + f.string.numeric(4);
  }

  // --- 核心逻辑 ---
  const sexType = gender === 'female' ? 'female' : 'male';
  
  // 1. 州/省名称处理
  let finalStateCode = region;
  if (country === 'US' && US_STATE_DATA[region]) {
    finalStateName = US_STATE_DATA[region].name; // 获取全称 (Oregon)
    finalStateCode = region; // 保留代码 (OR)
  } else if (country === 'US' && !region) {
     const keys = Object.keys(US_STATE_DATA);
     finalStateCode = keys[Math.floor(Math.random() * keys.length)];
     finalStateName = US_STATE_DATA[finalStateCode].name;
  } else {
     finalStateName = region || f.location.state();
  }

  // 2. 城市处理 (清洗中文 "Helena - 海伦娜" -> "Helena")
  let finalCityRaw = city || f.location.city();
  let finalCity = finalCityRaw.split(' - ')[0]; // 只取前半部分

  // 3. 电话处理
  if (country === 'US' && US_STATE_DATA[finalStateCode]) {
    const codes = US_STATE_DATA[finalStateCode].areaCodes;
    const areaCode = codes[Math.floor(Math.random() * codes.length)];
    const part2 = f.string.numeric(3);
    const part3 = f.string.numeric(4);
    finalPhone = `${areaCode}-${part2}-${part3}`; 
  } else {
    finalPhone = f.phone.number();
  }

  // 4. 邮编处理
  if (country === 'US' && US_STATE_DATA[finalStateCode]) {
    const prefixes = US_STATE_DATA[finalStateCode].zipPrefix;
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = f.string.numeric(3); 
    finalZip = `${prefix}${suffix}`; 
  } else {
    finalZip = f.location.zipCode('#####'); 
  }

  // 5. 街道与完整地址
  const finalStreet = f.location.streetAddress(false);
  
  if (country === 'US') {
    fullAddress = `${finalStreet} ${finalCity}, ${finalStateCode} ${finalZip}`;
  } else if (country === 'CN') {
    fullAddress = `${finalStateName}${finalCity}${finalStreet}`;
  } else {
    fullAddress = `${finalStreet}, ${finalZip} ${finalCity}, ${finalStateName}`;
  }
  
  // 6. 信用卡严格生成逻辑 (Visa 16, Master 16, Amex 15)
  // 随机选一个类型
  const cardTypes = ['Visa', 'MasterCard', 'American Express'];
  const selectedCardType = f.helpers.arrayElement(cardTypes);
  
  // 根据类型指定 Faker 的 provider，确保长度正确
  let providerName = '';
  if (selectedCardType === 'Visa') providerName = 'visa'; // 16位, 4开头
  else if (selectedCardType === 'MasterCard') providerName = 'mastercard'; // 16位, 5开头
  else providerName = 'amex'; // 15位, 34/37开头

  let ccNum = f.finance.creditCardNumber(providerName); 
  ccNum = ccNum.replace(/-/g, ''); // 移除所有横杠
  
  const birthDate = f.date.birthdate({ mode: 'age', min: parseInt(age), max: parseInt(age) });

  return {
    personal: {
      fullName: country === 'CN' || country === 'JP' 
        ? `${f.person.lastName()}${f.person.firstName(sexType)}` 
        : `${f.person.firstName(sexType)} ${f.person.lastName()}`,
      gender: gender === 'female' ? (country === 'CN' ? '女性' : 'Female') : (country === 'CN' ? '男性' : 'Male'),
      age: age,
      birthday: birthDate.toISOString().split('T')[0],
      phone: finalPhone,
      avatar: f.image.avatar(),
    },
    location: {
      country: country,
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
    country: query.country || 'US',
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
      <title>Pro ID Generator</title>
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
    
        /* 信用卡增强样式 */
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
              <select id="country" onchange="updateRegions()">
                <option value="US">美国 (USA)</option>
                <option value="CN">中国 (China)</option>
                <option value="JP">日本 (Japan)</option>
                <option value="DE">德国 (Germany)</option>
              </select>
            </div>
            <div class="group">
              <label>州/省 (State/Region)</label>
              <select id="region" onchange="updateCities()">
                <option value="">-- 请选择 / Select --</option>
              </select>
            </div>
            <div class="group">
              <label>城市 (City)</label>
              <select id="city">
                <option value="">-- 请选择 / Select --</option>
              </select>
            </div>
          </div>
          <div class="row">
             <div class="group">
              <label>性别 / Gender</label>
              <select id="gender">
                <option value="male">男性 (Male)</option>
                <option value="female">女性 (Female)</option>
              </select>
            </div>
            <div class="group">
              <label>年龄 / Age</label>
              <select id="age"></select>
            </div>
          </div>
          <button onclick="generate()">生成身份信息 (Generate Identity)</button>
        </div>

        <div id="resultCard" class="card">
          <div class="header">
            <img id="resAvatar" class="avatar" src="">
            <div>
              <h1 id="resName" style="margin:0; font-size: 24px;"></h1>
              <div id="resBasic" style="opacity: 0.8; font-size: 14px; margin-top:5px;"></div>
            </div>
          </div>
          <div class="info-grid">
            
            <div class="field full-width">
              <label>完整地址 / Full Address</label>
              <div id="resFullAddress" class="highlight">-</div>
            </div>

            <div class="field"><label>电话 / Phone</label><div id="resPhone">-</div></div>
            <div class="field"><label>生日 / Birthday</label><div id="resBirthday">-</div></div>
            
            <div class="field"><label id="labelID">SSN</label><div id="resID">-</div></div>
            <div class="field"><label>电子邮箱 / Email</label><div id="resEmail" style="font-size:13px;">-</div></div>

            <div class="field"><label>州全称 / State</label><div id="resStateFull">-</div></div>
            <!-- 新增：城市单独显示 -->
            <div class="field"><label>城市 / City</label><div id="resCity">-</div></div>
            
            <div class="field"><label>邮编 / Zip Code</label><div id="resZip">-</div></div>
            <div class="field"><label>无 / Empty</label><div style="border:none;"></div></div>

            <!-- 信用卡专属区域 (双语对照) -->
            <div class="field full-width">
              <label>信用卡信息 / Credit Card Details</label>
              <div class="cc-box">
                <div style="font-size: 20px; margin-bottom: 10px; font-family: monospace;" id="resCCNum">0000 0000 0000 0000</div>
                <div class="cc-row">
                  <div>
                    <span class="cc-label">类型 / Type</span>
                    <span class="cc-val" id="resCCType">-</span>
                  </div>
                  <div>
                    <span class="cc-label">过期 / Exp</span>
                    <span class="cc-val" id="resCCExp">-</span>
                  </div>
                  <div>
                    <span class="cc-label">安全码 / CVV</span>
                    <span class="cc-val" id="resCCCVV">-</span>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>

      <script>
        // --- 前端数据 ---
        const geoData = {
          'US': {
            'MT': { 
              name: 'Montana (MT) - 蒙大拿州', 
              cities: ['Helena - 海伦娜 [首府]', 'Billings - 比灵斯', 'Missoula - 米苏拉', 'Bozeman - 博兹曼', 'Great Falls - 大瀑布城'] 
            },
            'DE': { 
              name: 'Delaware (DE) - 特拉华州', 
              cities: ['Dover - 多佛 [首府]', 'Wilmington - 威尔明顿', 'Newark - 纽瓦克', 'Middletown - 米德尔敦'] 
            },
            'OR': { 
              name: 'Oregon (OR) - 俄勒冈州', 
              cities: ['Salem - 塞勒姆 [首府]', 'Portland - 波特兰', 'Eugene - 尤金', 'Gresham - 格雷沙姆'] 
            },
            'CA': { 
              name: 'California (CA) - 加利福尼亚州', 
              cities: ['Sacramento - 萨克拉门托 [首府]', 'Los Angeles - 洛杉矶', 'San Francisco - 旧金山', 'San Diego - 圣地亚哥', 'San Jose - 圣荷西'] 
            },
            'NY': { 
              name: 'New York (NY) - 纽约州', 
              cities: ['Albany - 奥尔巴尼 [首府]', 'New York City - 纽约市', 'Buffalo - 布法罗', 'Rochester - 罗切斯特'] 
            },
            'TX': { 
              name: 'Texas (TX) - 得克萨斯州', 
              cities: ['Austin - 奥斯汀 [首府]', 'Houston - 休斯敦', 'Dallas - 达拉斯', 'San Antonio - 圣安东尼奥'] 
            },
            'FL': { 
              name: 'Florida (FL) - 佛罗里达州', 
              cities: ['Tallahassee - 塔拉哈西 [首府]', 'Miami - 迈阿密', 'Orlando - 奥兰多', 'Tampa - 坦帕', 'Jacksonville - 杰克逊维尔'] 
            }
          },
          'CN': {
            '北京市': { name: '北京市', cities: ['东城区', '西城区', '朝阳区', '海淀区'] },
            '广东省': { name: '广东省', cities: ['广州市', '深圳市', '珠海市'] }
          },
          'JP': {
            'Tokyo': { name: 'Tokyo', cities: ['Shinjuku', 'Shibuya'] }
          },
          'DE': {
            'Berlin': { name: 'Berlin', cities: ['Berlin'] }
          }
        };

        // 初始化年龄
        const ageSelect = document.getElementById('age');
        for (let i = 18; i <= 80; i++) {
          const opt = document.createElement('option');
          opt.value = i;
          opt.innerText = i;
          if (i === 25) opt.selected = true; 
          ageSelect.appendChild(opt);
        }

        const countrySelect = document.getElementById('country');
        const regionSelect = document.getElementById('region');
        const citySelect = document.getElementById('city');

        function updateRegions() {
          const country = countrySelect.value;
          const data = geoData[country];
          regionSelect.innerHTML = '<option value="">-- 随机 / Random --</option>';
          citySelect.innerHTML = '<option value="">-- 随机 / Random --</option>';
          if (data) {
            Object.keys(data).forEach(key => {
              const item = data[key];
              const opt = document.createElement('option');
              opt.value = key; 
              opt.innerText = item.name; 
              regionSelect.appendChild(opt);
            });
          }
        }

        function updateCities() {
          const country = countrySelect.value;
          const region = regionSelect.value;
          citySelect.innerHTML = '<option value="">-- 随机 / Random --</option>';
          if (country && region && geoData[country][region]) {
            geoData[country][region].cities.forEach(c => {
              const opt = document.createElement('option');
              opt.value = c;
              opt.innerText = c; 
              citySelect.appendChild(opt);
            });
          }
        }

        async function generate() {
          const btn = document.querySelector('button');
          const originalText = btn.innerText;
          btn.innerText = '生成中... (Generating)';
          btn.disabled = true;

          const params = new URLSearchParams({
            country: countrySelect.value,
            region: regionSelect.value,
            city: citySelect.value,
            gender: document.getElementById('gender').value,
            age: document.getElementById('age').value
          });

          try {
            const res = await fetch('/api/generate?' + params.toString());
            const data = await res.json();
            renderCard(data);
          } catch (e) {
            alert('生成失败，请重试');
            console.error(e);
          } finally {
            btn.innerText = originalText;
            btn.disabled = false;
          }
        }

        function renderCard(data) {
          document.getElementById('resultCard').classList.add('active');
          document.getElementById('resAvatar').src = data.personal.avatar;
          document.getElementById('resName').innerText = data.personal.fullName;
          document.getElementById('resBasic').innerText = \`\${data.personal.gender}, \${data.personal.age} years old\`;
          
          document.getElementById('resPhone').innerText = data.personal.phone;
          document.getElementById('resBirthday').innerText = data.personal.birthday;
          document.getElementById('labelID').innerText = data.ids.name;
          document.getElementById('resID').innerText = data.ids.value;
          
          document.getElementById('resFullAddress').innerText = data.location.formatted;
          document.getElementById('resStateFull').innerText = data.location.stateFull;
          document.getElementById('resCity').innerText = data.location.city; // 填充城市
          document.getElementById('resZip').innerText = data.location.zipCode; 
          
          // 信用卡
          document.getElementById('resCCNum').innerText = data.finance.ccNumber;
          document.getElementById('resCCType').innerText = data.finance.ccType;
          document.getElementById('resCCExp').innerText = data.finance.ccExp;
          document.getElementById('resCCCVV').innerText = data.finance.ccCVV;
          
          document.getElementById('resEmail').innerText = \`user\${Math.floor(Math.random()*9999)}@example.com\`; 
        }

        updateRegions();
      </script>
    </body>
    </html>
  `;
  return c.html(html);
});

export default app;
