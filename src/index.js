import { Hono } from 'hono'
import { fakerZH_CN, fakerEN_US, fakerJA, fakerDE } from '@faker-js/faker'

const app = new Hono()

// --- 1. 后端逻辑：根据参数生成特定身份 ---
function generateSpecificIdentity(params) {
  const { country, region, city, gender, age } = params;
  
  // 根据国家选择对应的 Faker 语言包
  let f;
  let idName = "ID Number";
  let idValue = "";
  
  switch (country) {
    case 'CN':
      f = fakerZH_CN;
      idName = "居民身份证 (ID Card)";
      // 模拟简单的中国身份证生成逻辑 (仅用于格式展示)
      const cnRegion = "110101"; // 示例地区码
      const cnYear = new Date().getFullYear() - age;
      const cnBirthday = `${cnYear}0101`;
      idValue = `${cnRegion}${cnBirthday}123X`; 
      break;
    case 'JP':
      f = fakerJA;
      idName = "マイナンバー (My Number)";
      idValue = f.phone.number('####-####-####'); // 模拟格式
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
      // 生成格式合法的 SSN (XXX-XX-XXXX)
      idValue = f.string.numeric(3) + "-" + f.string.numeric(2) + "-" + f.string.numeric(4);
      break;
  }

  // 处理性别 (Faker 接收 'female' 或 'male')
  const sexType = gender === 'female' ? 'female' : 'male';
  
  // 处理生日 (根据年龄反推)
  const birthDate = f.date.birthdate({ mode: 'age', min: parseInt(age), max: parseInt(age) });
  
  return {
    personal: {
      fullName: country === 'CN' || country === 'JP' 
        ? `${f.person.lastName()}${f.person.firstName(sexType)}` // 亚洲：姓+名
        : `${f.person.firstName(sexType)} ${f.person.lastName()}`, // 西方：名+姓
      gender: gender === 'female' ? (country === 'CN' ? '女性' : 'Female') : (country === 'CN' ? '男性' : 'Male'),
      age: age,
      birthday: birthDate.toISOString().split('T')[0],
      phone: f.phone.number(),
      avatar: f.image.avatar(),
    },
    location: {
      country: country,
      // 如果用户选了州/市，就用用户的；否则用 Faker 随机生成的
      state: region || f.location.state(),
      city: city || f.location.city(),
      // 街道和邮编由 Faker 随机生成，模拟该国格式
      street: f.location.streetAddress(true), 
      zipCode: f.location.zipCode(),
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
  // 默认值处理
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

// --- 3. 前端页面 (包含地理数据映射) ---
app.get('/', (c) => {
  const html = `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>高级身份生成器 | Advanced ID Gen</title>
      <style>
        body { font-family: "Segoe UI", sans-serif; background: #f0f2f5; margin: 0; padding: 20px; display: flex; justify-content: center; }
        .container { display: flex; flex-direction: column; gap: 20px; width: 100%; max-width: 800px; }
        
        /* 控制面板样式 */
        .controls { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .row { display: flex; gap: 15px; flex-wrap: wrap; margin-bottom: 15px; }
        .group { flex: 1; min-width: 140px; }
        label { display: block; font-size: 12px; color: #666; margin-bottom: 5px; font-weight: bold;}
        select, input { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; box-sizing: border-box; }
        button { background: #0070f3; color: white; border: none; padding: 12px; border-radius: 6px; cursor: pointer; font-weight: bold; width: 100%; font-size: 16px; transition: 0.2s; }
        button:hover { background: #005bb5; }

        /* 结果卡片样式 */
        .card { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.15); display: none; }
        .card.active { display: block; }
        .header { background: linear-gradient(135deg, #0070f3, #00a6ff); color: white; padding: 30px; display: flex; align-items: center; }
        .avatar { width: 80px; height: 80px; border-radius: 50%; border: 4px solid rgba(255,255,255,0.4); margin-right: 20px; background: #eee; }
        .info-grid { padding: 20px; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
        .field { background: #f9fafb; padding: 10px; border-radius: 6px; border: 1px solid #eee; }
        .field label { color: #888; font-size: 11px; text-transform: uppercase; margin-bottom: 4px; }
        .field div { font-family: monospace; font-size: 15px; color: #333; font-weight: 600; word-break: break-all; }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- 控制区域 -->
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
              <label>州/省 (Region)</label>
              <select id="region" onchange="updateCities()">
                <option value="">-- 请选择 --</option>
              </select>
            </div>
            <div class="group">
              <label>城市 (City)</label>
              <select id="city">
                <option value="">-- 请选择 --</option>
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
              <input type="number" id="age" value="28" min="18" max="80">
            </div>
          </div>
          <button onclick="generate()">生成身份 (Generate)</button>
        </div>

        <!-- 结果显示区域 -->
        <div id="resultCard" class="card">
          <div class="header">
            <img id="resAvatar" class="avatar" src="">
            <div>
              <h1 id="resName" style="margin:0; font-size: 24px;"></h1>
              <div id="resBasic" style="opacity: 0.9; font-size: 14px; margin-top:5px;"></div>
            </div>
          </div>
          <div class="info-grid">
            <div class="field"><label>生日 / Birthday</label><div id="resBirthday">-</div></div>
            <div class="field"><label>电话 / Phone</label><div id="resPhone">-</div></div>
            <div class="field"><label id="labelID">SSN/ID</label><div id="resID">-</div></div>
            
            <div class="field" style="grid-column: span 2;">
              <label>地址 / Address</label>
              <div id="resAddress">-</div>
            </div>
            <div class="field"><label>城市 / City</label><div id="resCity">-</div></div>
            <div class="field"><label>州/省 / State</label><div id="resState">-</div></div>
            <div class="field"><label>邮编 / Zip</label><div id="resZip">-</div></div>
            <div class="field"><label>信用卡 / Credit Card</label><div id="resCC">-</div></div>
          </div>
        </div>
      </div>

      <script>
        // --- 地理数据映射 (前端硬编码) ---
        const geoData = {
          'US': {
            'Oregon': ['Portland', 'Salem', 'Eugene'],
            'California': ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento'],
            'New York': ['New York City', 'Buffalo', 'Albany'],
            'Texas': ['Houston', 'Austin', 'Dallas'],
            'Florida': ['Miami', 'Orlando', 'Tampa']
          },
          'CN': {
            '北京市': ['朝阳区', '海淀区', '东城区'],
            '广东省': ['广州市', '深圳市', '珠海市'],
            '上海市': ['浦东新区', '黄浦区'],
            '浙江省': ['杭州市', '宁波市', '温州市']
          },
          'JP': {
            'Tokyo': ['Shinjuku', 'Shibuya', 'Minato'],
            'Osaka': ['Osaka City', 'Sakai'],
            'Kyoto': ['Kyoto City', 'Uji']
          },
          'DE': {
            'Bavaria': ['Munich', 'Nuremberg'],
            'Berlin': ['Berlin'],
            'Hamburg': ['Hamburg']
          }
        };

        const countrySelect = document.getElementById('country');
        const regionSelect = document.getElementById('region');
        const citySelect = document.getElementById('city');

        // 更新州/省下拉框
        function updateRegions() {
          const country = countrySelect.value;
          const regions = geoData[country] ? Object.keys(geoData[country]) : [];
          
          regionSelect.innerHTML = '<option value="">-- 随机 / Random --</option>';
          citySelect.innerHTML = '<option value="">-- 随机 / Random --</option>';
          
          regions.forEach(r => {
            const opt = document.createElement('option');
            opt.value = r;
            opt.innerText = r;
            regionSelect.appendChild(opt);
          });
        }

        // 更新城市下拉框
        function updateCities() {
          const country = countrySelect.value;
          const region = regionSelect.value;
          
          citySelect.innerHTML = '<option value="">-- 随机 / Random --</option>';
          
          if (country && region && geoData[country][region]) {
            geoData[country][region].forEach(c => {
              const opt = document.createElement('option');
              opt.value = c;
              opt.innerText = c;
              citySelect.appendChild(opt);
            });
          }
        }

        // 调用 API 生成数据
        async function generate() {
          const btn = document.querySelector('button');
          btn.innerText = '生成中...';
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
          } finally {
            btn.innerText = '生成身份 (Generate)';
            btn.disabled = false;
          }
        }

        // 渲染结果到卡片
        function renderCard(data) {
          document.getElementById('resultCard').classList.add('active');
          document.getElementById('resAvatar').src = data.personal.avatar;
          document.getElementById('resName').innerText = data.personal.fullName;
          document.getElementById('resBasic').innerText = \`\${data.personal.gender}, \${data.personal.age} years old\`;
          
          document.getElementById('resBirthday').innerText = data.personal.birthday;
          document.getElementById('resPhone').innerText = data.personal.phone;
          
          document.getElementById('labelID').innerText = data.ids.name;
          document.getElementById('resID').innerText = data.ids.value;
          
          document.getElementById('resAddress').innerText = data.location.street;
          document.getElementById('resCity').innerText = data.location.city;
          document.getElementById('resState').innerText = data.location.state;
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
