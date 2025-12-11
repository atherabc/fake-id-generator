import { Hono } from 'hono'
import { fakerZH_CN, fakerEN_US, fakerJA, fakerDE } from '@faker-js/faker'

const app = new Hono()

// --- 1. 后端逻辑：生成身份数据 ---
function generateSpecificIdentity(params) {
  const { country, region, city, gender, age } = params;
  
  let f;
  let idName = "ID Number";
  let idValue = "";
  let fullAddress = ""; // 用于存放完整格式地址
  
  // 根据国家初始化 Faker 和 ID 逻辑
  switch (country) {
    case 'CN':
      f = fakerZH_CN;
      idName = "居民身份证 (ID Card)";
      const cnRegion = "110101"; 
      const cnYear = new Date().getFullYear() - age;
      idValue = `${cnRegion}${cnYear}0101123X`; 
      break;
    case 'JP':
      f = fakerJA;
      idName = "マイナンバー (My Number)";
      idValue = f.phone.number('####-####-####');
      break;
    case 'DE':
      f = fakerDE;
      idName = "Ausweisnummer";
      idValue = f.string.alphanumeric(9).toUpperCase();
      break;
    case 'US':
    default:
      f = fakerEN_US;
      idName = "SSN (Social Security)";
      idValue = f.string.numeric(3) + "-" + f.string.numeric(2) + "-" + f.string.numeric(4);
      break;
  }

  // 处理性别和年龄
  const sexType = gender === 'female' ? 'female' : 'male';
  const birthDate = f.date.birthdate({ mode: 'age', min: parseInt(age), max: parseInt(age) });
  
  // 处理地址逻辑
  // 如果前端传来了特定城市/州，就用传来的，否则随机生成
  const finalState = region || (country === 'US' ? f.location.state({ abbreviated: true }) : f.location.state());
  const finalCity = city || f.location.city();
  const finalStreet = f.location.streetAddress(false); // false 表示不包含城市名，只生成街道
  const finalZip = f.location.zipCode();

  // === 核心修改：生成完整地址字符串 ===
  // 格式：35254 Williamson Ridges Gray, ME 04039
  if (country === 'US') {
    fullAddress = `${finalStreet} ${finalCity}, ${finalState} ${finalZip}`;
  } else if (country === 'CN') {
    fullAddress = `${finalState}${finalCity}${finalStreet}`; // 中文习惯
  } else {
    fullAddress = `${finalStreet}, ${finalZip} ${finalCity}, ${finalState}`; // 欧美通用
  }
  
  return {
    personal: {
      fullName: country === 'CN' || country === 'JP' 
        ? `${f.person.lastName()}${f.person.firstName(sexType)}` 
        : `${f.person.firstName(sexType)} ${f.person.lastName()}`,
      gender: gender === 'female' ? (country === 'CN' ? '女性' : 'Female') : (country === 'CN' ? '男性' : 'Male'),
      age: age,
      birthday: birthDate.toISOString().split('T')[0],
      phone: f.phone.number(),
      avatar: f.image.avatar(),
    },
    location: {
      country: country,
      state: finalState,
      city: finalCity,
      street: finalStreet,
      zipCode: finalZip,
      formatted: fullAddress // 新增：完整格式化地址
    },
    ids: {
      name: idName,
      value: idValue
    },
    finance: {
      cc: f.finance.creditCardNumber(),
      cvv: f.finance.creditCardCVV(),
    }
  };
}

// --- 2. API 接口 ---
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

// --- 3. 前端页面 ---
app.get('/', (c) => {
  const html = `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Full Address ID Generator</title>
      <style>
        body { font-family: "Segoe UI", sans-serif; background: #eef2f6; margin: 0; padding: 20px; display: flex; justify-content: center; }
        .container { display: flex; flex-direction: column; gap: 20px; width: 100%; max-width: 800px; }
        
        .controls { background: white; padding: 25px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
        .row { display: flex; gap: 15px; flex-wrap: wrap; margin-bottom: 15px; }
        .group { flex: 1; min-width: 140px; }
        label { display: block; font-size: 13px; color: #555; margin-bottom: 6px; font-weight: 600;}
        select, input { width: 100%; padding: 12px; border: 1px solid #e0e0e0; border-radius: 8px; font-size: 14px; outline: none; transition: 0.2s; background: #f9f9f9; }
        select:focus, input:focus { border-color: #0070f3; background: #fff; }
        
        button { background: #0070f3; color: white; border: none; padding: 14px; border-radius: 8px; cursor: pointer; font-weight: bold; width: 100%; font-size: 16px; transition: 0.2s; margin-top: 10px; }
        button:hover { background: #005bb5; transform: translateY(-1px); }

        .card { background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); display: none; animation: slideIn 0.3s ease; }
        @keyframes slideIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        
        .card.active { display: block; }
        .header { background: linear-gradient(135deg, #0052cc, #0070f3); color: white; padding: 30px; display: flex; align-items: center; }
        .avatar { width: 90px; height: 90px; border-radius: 50%; border: 4px solid rgba(255,255,255,0.3); margin-right: 25px; background: #ddd; object-fit: cover; }
        
        .info-grid { padding: 25px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
        
        /* 针对地址栏的特殊样式：跨两列 */
        .full-width { grid-column: span 2; }
        
        .field { background: #f8f9fa; padding: 12px 15px; border-radius: 8px; border: 1px solid #eee; transition: 0.2s; }
        .field:hover { border-color: #ddd; background: #fff; }
        .field label { color: #888; font-size: 11px; text-transform: uppercase; margin-bottom: 5px; letter-spacing: 0.5px; }
        .field div { font-family: "Consolas", monospace; font-size: 15px; color: #222; font-weight: 600; word-break: break-word; }
        
        /* 复制提示 */
        .copy-hint { font-size: 10px; color: #999; float: right; cursor: pointer; }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- 控制面板 -->
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
                <option value="">-- 随机 / Random --</option>
              </select>
            </div>
            <div class="group">
              <label>城市 (City)</label>
              <select id="city">
                <option value="">-- 随机 / Random --</option>
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
              <input type="number" id="age" value="25" min="18" max="80">
            </div>
          </div>
          <button onclick="generate()">生成身份 (Generate Identity)</button>
        </div>

        <!-- 结果卡片 -->
        <div id="resultCard" class="card">
          <div class="header">
            <img id="resAvatar" class="avatar" src="">
            <div>
              <h1 id="resName" style="margin:0; font-size: 26px;"></h1>
              <div id="resBasic" style="opacity: 0.9; font-size: 15px; margin-top:6px;"></div>
            </div>
          </div>
          <div class="info-grid">
            <div class="field full-width">
              <label>完整地址 / Full Address (Street, City, State Zip)</label>
              <div id="resFullAddress" style="color:#0052cc; font-size:16px;">-</div>
            </div>

            <div class="field"><label>生日 / Birthday</label><div id="resBirthday">-</div></div>
            <div class="field"><label>电话 / Phone</label><div id="resPhone">-</div></div>
            
            <div class="field"><label id="labelID">SSN</label><div id="resID">-</div></div>
            <div class="field"><label>信用卡 / Credit Card</label><div id="resCC">-</div></div>
            
            <!-- 这里可以根据需要保留单独的省市信息，或者如果只要完整地址也可以删掉下面这些 -->
            <div class="field"><label>城市 / City</label><div id="resCity">-</div></div>
            <div class="field"><label>邮编 / Zip</label><div id="resZip">-</div></div>
          </div>
        </div>
      </div>

      <script>
        // --- 核心升级：包含州缩写和更多城市的数据 ---
        // 为了生成 "ME 04039" 格式，US 的键名改成了缩写
        const geoData = {
          'US': {
            'OR': { name: 'Oregon', cities: ['Portland', 'Salem', 'Eugene', 'Gresham'] },
            'CA': { name: 'California', cities: ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento', 'San Jose'] },
            'NY': { name: 'New York', cities: ['New York City', 'Buffalo', 'Albany', 'Rochester'] },
            'TX': { name: 'Texas', cities: ['Houston', 'Austin', 'Dallas', 'San Antonio'] },
            'FL': { name: 'Florida', cities: ['Miami', 'Orlando', 'Tampa', 'Jacksonville'] },
            // 新增：蒙大拿州 (Montana)
            'MT': { name: 'Montana', cities: ['Helena', 'Billings', 'Missoula', 'Bozeman', 'Great Falls'] },
            // 新增：特拉华州 (Delaware)
            'DE': { name: 'Delaware', cities: ['Dover', 'Wilmington', 'Newark', 'Middletown'] }
          },
          'CN': {
            '北京市': { name: '北京市', cities: ['朝阳区', '海淀区', '东城区', '西城区'] },
            '广东省': { name: '广东省', cities: ['广州市', '深圳市', '珠海市', '佛山市'] },
            '上海市': { name: '上海市', cities: ['浦东新区', '黄浦区', '静安区'] },
            '浙江省': { name: '浙江省', cities: ['杭州市', '宁波市', '温州市'] }
          },
          'JP': {
            'Tokyo': { name: 'Tokyo', cities: ['Shinjuku', 'Shibuya', 'Minato', 'Akihabara'] },
            'Osaka': { name: 'Osaka', cities: ['Osaka City', 'Sakai'] }
          },
          'DE': {
            'Bavaria': { name: 'Bavaria', cities: ['Munich', 'Nuremberg', 'Augsburg'] },
            'Berlin': { name: 'Berlin', cities: ['Berlin'] }
          }
        };

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
              opt.value = key; // 传递给后端的是键名 (如 'MT', 'DE', 'OR')
              // 显示给用户的是全名 (如 'Montana (MT)')
              opt.innerText = country === 'US' ? \`\${item.name} (\${key})\` : item.name;
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
          btn.innerText = '正在生成... (Generating)';
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
            alert('Error generating data');
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
          
          document.getElementById('resBirthday').innerText = data.personal.birthday;
          document.getElementById('resPhone').innerText = data.personal.phone;
          
          document.getElementById('labelID').innerText = data.ids.name;
          document.getElementById('resID').innerText = data.ids.value;
          
          // 这里的关键：直接显示后端传回来的完整格式地址
          document.getElementById('resFullAddress').innerText = data.location.formatted;
          
          // 额外信息
          document.getElementById('resCity').innerText = data.location.city;
          document.getElementById('resZip').innerText = data.location.zipCode;
          document.getElementById('resCC').innerText = data.finance.cc;
        }

        // 初始化
        updateRegions();
      </script>
    </body>
    </html>
  `;
  return c.html(html);
});

export default app;
