import { Hono } from 'hono'
import { fakerEN_US } from '@faker-js/faker'

const app = new Hono()

// --- 1. 后端数据：全美50州 + DC ---
const US_STATE_DATA = {
  // === 免税州 (Tax Free) ===
  'MT': { name: 'Montana', zipPrefix: ['59'], areaCodes: ['406'] },
  'DE': { name: 'Delaware', zipPrefix: ['19'], areaCodes: ['302'] },
  'OR': { name: 'Oregon', zipPrefix: ['97'], areaCodes: ['503', '541', '971'] },
  'NH': { name: 'New Hampshire', zipPrefix: ['03'], areaCodes: ['603'] },
  'AK': { name: 'Alaska', zipPrefix: ['99'], areaCodes: ['907'] },

  // === 其他州 ===
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
  'NE': { name: 'Nebraska', zipPrefix: ['68', '69'], areaCodes: ['402', '308'] },
  'NV': { name: 'Nevada', zipPrefix: ['88', '89'], areaCodes: ['702', '775'] },
  'NJ': { name: 'New Jersey', zipPrefix: ['07', '08'], areaCodes: ['201', '732', '609', '856'] },
  'NM': { name: 'New Mexico', zipPrefix: ['87', '88'], areaCodes: ['505', '575'] },
  'NY': { name: 'New York', zipPrefix: ['10', '11', '12', '13', '14'], areaCodes: ['212', '718', '917', '646', '315'] },
  'NC': { name: 'North Carolina', zipPrefix: ['27', '28'], areaCodes: ['919', '704', '336', '252'] },
  'ND': { name: 'North Dakota', zipPrefix: ['58'], areaCodes: ['701'] },
  'OH': { name: 'Ohio', zipPrefix: ['43', '44', '45'], areaCodes: ['216', '614', '513', '937'] },
  'OK': { name: 'Oklahoma', zipPrefix: ['73', '74'], areaCodes: ['405', '918', '580'] },
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
  const f = fakerEN_US; 
  
  const idName = "社会安全码 (SSN)";
  const idValue = f.string.numeric(3) + "-" + f.string.numeric(2) + "-" + f.string.numeric(4);
  const sexType = gender === 'female' ? 'female' : 'male';
  
  let finalStateCode = region;
  let finalStateName = "";
  
  if (region && US_STATE_DATA[region]) {
    finalStateName = US_STATE_DATA[region].name;
  } else {
     const keys = Object.keys(US_STATE_DATA);
     finalStateCode = keys[Math.floor(Math.random() * keys.length)];
     finalStateName = US_STATE_DATA[finalStateCode].name;
  }

  let finalCityRaw = city || f.location.city();
  let finalCity = finalCityRaw.split(' - ')[0].replace('[首府]', '').replace('[Capital]', '').trim();

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

  let finalZip = "";
  if (US_STATE_DATA[finalStateCode]) {
    const prefixes = US_STATE_DATA[finalStateCode].zipPrefix;
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = f.string.numeric(3); 
    finalZip = `${prefix}${suffix}`; 
  } else {
    finalZip = f.location.zipCode('#####'); 
  }

  const finalStreet = f.location.streetAddress(false);
  const fullAddress = `${finalStreet} ${finalCity}, ${finalStateCode} ${finalZip}`;
  
  const cardTypes = ['Visa', 'MasterCard', 'American Express'];
  const selectedCardType = f.helpers.arrayElement(cardTypes);
  
  let providerName = '';
  if (selectedCardType === 'Visa') providerName = 'visa';
  else if (selectedCardType === 'MasterCard') providerName = 'mastercard'; 
  else providerName = 'amex'; 

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
        .field div { font-family: "Consolas", "Monaco", monospace; font-size: 15px; color: #333; font-weight: 600; border-bottom: 1px solid #f0f0f0; padding-bottom: 5px; min-height: 20px; position: relative; }
        
        /* 复制功能样式增强 */
        .copy-hover { 
          cursor: pointer; 
          transition: background 0.2s, color 0.2s; 
          border-radius: 4px; 
          padding: 2px 5px; 
          margin: -2px -5px; /* offset padding */
        }
        .copy-hover:hover { 
          background: #e6f7ff; 
          color: #0070f3; 
        }
        .copy-hover:hover::after {
          content: '📋';
          position: absolute;
          right: 5px;
          font-size: 12px;
          opacity: 0.7;
        }

        .highlight { color: #0070f3 !important; font-size: 16px !important; }
    
        .cc-box { background: linear-gradient(135deg, #2c3e50, #4ca1af); color: white; padding: 15px; border-radius: 8px; margin-top: 5px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .cc-box div { color: white; border: none; text-shadow: 0 1px 2px rgba(0,0,0,0.2); letter-spacing: 1px; }
        .cc-row { display: flex; gap: 20px; margin-top: 10px; }
        .cc-label { font-size: 10px; opacity: 0.8; display: block; margin-bottom: 2px; text-transform: uppercase; }
        .cc-val { font-size: 14px; font-weight: bold; }
        
        /* 信用卡部分的特殊复制样式 */
        .cc-copy-hover { cursor: pointer; border-radius: 4px; padding: 0 2px; transition: 0.2s; }
        .cc-copy-hover:hover { background: rgba(255,255,255,0.2); }

        /* Toast 提示框 */
        .toast {
          position: fixed;
          bottom: 30px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0,0,0,0.85);
          color: white;
          padding: 10px 24px;
          border-radius: 30px;
          font-size: 14px;
          font-weight: 500;
          opacity: 0;
          transition: opacity 0.3s ease, transform 0.3s ease;
          pointer-events: none;
          z-index: 9999;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .toast.show {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
        .toast.hide {
          transform: translateX(-50%) translateY(10px);
        }
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
              <select id="age"></select>
            </div>
          </div>
          <button onclick="generate()">生成身份信息 (Generate Identity)</button>
        </div>

        <div id="resultCard" class="card">
          <div class="header">
            <img id="resAvatar" class="avatar" src="">
            <div>
              <h1 id="resName" class="copy-hover" style="margin:0; font-size: 24px; display:inline-block;"></h1>
              <div id="resBasic" style="opacity: 0.8; font-size: 14px; margin-top:5px;"></div>
            </div>
          </div>
          <div class="info-grid">
            
            <div class="field full-width">
              <label>完整地址 / Full Address (Click to copy)</label>
              <div id="resFullAddress" class="highlight">-</div>
            </div>

            <div class="field"><label>电话 / Phone</label><div id="resPhone">-</div></div>
            <div class="field"><label>生日 / Birthday</label><div id="resBirthday">-</div></div>
            
            <div class="field"><label id="labelID">SSN</label><div id="resID">-</div></div>
            <div class="field"><label>电子邮箱 / Email</label><div id="resEmail" style="font-size:13px;">-</div></div>

            <div class="field"><label>州全称 / State</label><div id="resStateFull">-</div></div>
            <div class="field"><label>城市 / City</label><div id="resCity">-</div></div>
            
            <div class="field"><label>邮编 / Zip Code</label><div id="resZip">-</div></div>
            <div class="field"><label>无 / Empty</label><div style="border:none;"></div></div>

            <div class="field full-width">
              <label>信用卡信息 / Credit Card Details (Click fields to copy)</label>
              <div class="cc-box">
                <div style="font-size: 20px; margin-bottom: 10px; font-family: monospace;" id="resCCNum" class="cc-copy-hover">0000 0000 0000 0000</div>
                <div class="cc-row">
                  <div>
                    <span class="cc-label">类型 / Type</span>
                    <span class="cc-val cc-copy-hover" id="resCCType">-</span>
                  </div>
                  <div>
                    <span class="cc-label">过期 / Exp</span>
                    <span class="cc-val cc-copy-hover" id="resCCExp">-</span>
                  </div>
                  <div>
                    <span class="cc-label">安全码 / CVV</span>
                    <span class="cc-val cc-copy-hover" id="resCCCVV">-</span>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>

      <!-- Toast 容器 -->
      <div id="toast" class="toast">已复制到剪贴板</div>

      <script>
        // --- 前端数据 ---
        const geoData = {
          'MT': { name: 'Montana (MT) - 蒙大拿州', cities: ['Helena - 海伦娜 [首府]', 'Billings - 比灵斯', 'Missoula - 米苏拉', 'Bozeman - 博兹曼'] },
          'DE': { name: 'Delaware (DE) - 特拉华州', cities: ['Dover - 多佛 [首府]', 'Wilmington - 威尔明顿', 'Newark - 纽瓦克'] },
          'OR': { name: 'Oregon (OR) - 俄勒冈州', cities: ['Salem - 塞勒姆 [首府]', 'Portland - 波特兰', 'Eugene - 尤金', 'Gresham - 格雷沙姆'] },
          'NH': { name: 'New Hampshire (NH) - 新罕布什尔州', cities: ['Concord - 康科德 [首府]', 'Manchester - 曼彻斯特', 'Nashua - 纳舒厄'] },
          'AK': { name: 'Alaska (AK) - 阿拉斯加州', cities: ['Juneau - 朱诺 [首府]', 'Anchorage - 安克雷奇', 'Fairbanks - 费尔班克斯'] },
          'AL': { name: 'Alabama (AL) - 阿拉巴马州', cities: ['Montgomery - 蒙哥马利 [首府]', 'Birmingham - 伯明翰'] },
          'AZ': { name: 'Arizona (AZ) - 亚利桑那州', cities: ['Phoenix - 凤凰城 [首府]', 'Tucson - 图森'] },
          'AR': { name: 'Arkansas (AR) - 阿肯色州', cities: ['Little Rock - 小岩城 [首府]', 'Fayetteville - 费耶特维尔'] },
          'CA': { name: 'California (CA) - 加利福尼亚州', cities: ['Sacramento - 萨克拉门托 [首府]', 'Los Angeles - 洛杉矶', 'San Francisco - 旧金山', 'San Diego - 圣地亚哥'] },
          'CO': { name: 'Colorado (CO) - 科罗拉多州', cities: ['Denver - 丹佛 [首府]', 'Colorado Springs - 科罗拉多斯普林斯'] },
          'CT': { name: 'Connecticut (CT) - 康涅狄格州', cities: ['Hartford - 哈特福德 [首府]', 'Bridgeport - 布里奇波特', 'New Haven - 纽黑文'] },
          'DC': { name: 'District of Columbia (DC) - 华盛顿特区', cities: ['Washington - 华盛顿 [首府]'] },
          'FL': { name: 'Florida (FL) - 佛罗里达州', cities: ['Tallahassee - 塔拉哈西 [首府]', 'Miami - 迈阿密', 'Orlando - 奥兰多', 'Tampa - 坦帕'] },
          'GA': { name: 'Georgia (GA) - 佐治亚州', cities: ['Atlanta - 亚特兰大 [首府]', 'Augusta - 奥古斯塔'] },
          'HI': { name: 'Hawaii (HI) - 夏威夷州', cities: ['Honolulu - 檀香山 [首府]', 'Hilo - 希洛'] },
          'ID': { name: 'Idaho (ID) - 爱达荷州', cities: ['Boise - 博伊西 [首府]', 'Meridian - 此午线'] },
          'IL': { name: 'Illinois (IL) - 伊利诺伊州', cities: ['Springfield - 斯普林菲尔德 [首府]', 'Chicago - 芝加哥'] },
          'IN': { name: 'Indiana (IN) - 印第安纳州', cities: ['Indianapolis - 印第安纳波利斯 [首府]', 'Fort Wayne - 韦恩堡'] },
          'IA': { name: 'Iowa (IA) - 爱荷华州', cities: ['Des Moines - 得梅因 [首府]', 'Cedar Rapids - 锡达拉皮兹'] },
          'KS': { name: 'Kansas (KS) - 堪萨斯州', cities: ['Topeka - 托皮卡 [首府]', 'Wichita - 威奇托'] },
          'KY': { name: 'Kentucky (KY) - 肯塔基州', cities: ['Frankfort - 法兰克福 [首府]', 'Louisville - 路易斯维尔'] },
          'LA': { name: 'Louisiana (LA) - 路易斯安那州', cities: ['Baton Rouge - 巴吞鲁日 [首府]', 'New Orleans - 新奥尔良'] },
          'ME': { name: 'Maine (ME) - 缅因州', cities: ['Augusta - 奥古斯塔 [首府]', 'Portland - 波特兰'] },
          'MD': { name: 'Maryland (MD) - 马里兰州', cities: ['Annapolis - 安纳波利斯 [首府]', 'Baltimore - 巴尔的摩'] },
          'MA': { name: 'Massachusetts (MA) - 马萨诸塞州', cities: ['Boston - 波士顿 [首府]', 'Worcester - 伍斯特'] },
          'MI': { name: 'Michigan (MI) - 密歇根州', cities: ['Lansing - 兰辛 [首府]', 'Detroit - 底特律'] },
          'MN': { name: 'Minnesota (MN) - 明尼苏达州', cities: ['Saint Paul - 圣保罗 [首府]', 'Minneapolis - 明尼阿波利斯'] },
          'MS': { name: 'Mississippi (MS) - 密西西比州', cities: ['Jackson - 杰克逊 [首府]', 'Gulfport - 格尔夫波特'] },
          'MO': { name: 'Missouri (MO) - 密苏里州', cities: ['Jefferson City - 杰斐逊城 [首府]', 'Kansas City - 堪萨斯城'] },
          'NE': { name: 'Nebraska (NE) - 内布拉斯加州', cities: ['Lincoln - 林肯 [首府]', 'Omaha - 奥马哈'] },
          'NV': { name: 'Nevada (NV) - 内华达州', cities: ['Carson City - 卡森城 [首府]', 'Las Vegas - 拉斯维加斯'] },
          'NJ': { name: 'New Jersey (NJ) - 新泽西州', cities: ['Trenton - 特伦顿 [首府]', 'Newark - 纽瓦克'] },
          'NM': { name: 'New Mexico (NM) - 新墨西哥州', cities: ['Santa Fe - 圣菲 [首府]', 'Albuquerque - 阿尔伯克基'] },
          'NY': { name: 'New York (NY) - 纽约州', cities: ['Albany - 奥尔巴尼 [首府]', 'New York City - 纽约市', 'Buffalo - 布法罗'] },
          'NC': { name: 'North Carolina (NC) - 北卡罗来纳州', cities: ['Raleigh - 罗利 [首府]', 'Charlotte - 夏洛特'] },
          'ND': { name: 'North Dakota (ND) - 北达科他州', cities: ['Bismarck - 俾斯麦 [首府]', 'Fargo - 法戈'] },
          'OH': { name: 'Ohio (OH) - 俄亥俄州', cities: ['Columbus - 哥伦布 [首府]', 'Cleveland - 克利夫兰'] },
          'OK': { name: 'Oklahoma (OK) - 俄克拉荷马州', cities: ['Oklahoma City - 俄克拉荷马城 [首府]', 'Tulsa - 塔尔萨'] },
          'PA': { name: 'Pennsylvania (PA) - 宾夕法尼亚州', cities: ['Harrisburg - 哈里斯堡 [首府]', 'Philadelphia - 费城', 'Pittsburgh - 匹兹堡'] },
          'RI': { name: 'Rhode Island (RI) - 罗德岛州', cities: ['Providence - 普罗维登斯 [首府]', 'Warwick - 沃里克'] },
          'SC': { name: 'South Carolina (SC) - 南卡罗来纳州', cities: ['Columbia - 哥伦比亚 [首府]', 'Charleston - 查尔斯顿'] },
          'SD': { name: 'South Dakota (SD) - 南达科他州', cities: ['Pierre - 皮尔 [首府]', 'Sioux Falls - 苏瀑'] },
          'TN': { name: 'Tennessee (TN) - 田纳西州', cities: ['Nashville - 纳什维尔 [首府]', 'Memphis - 孟菲斯'] },
          'TX': { name: 'Texas (TX) - 得克萨斯州', cities: ['Austin - 奥斯汀 [首府]', 'Houston - 休斯敦', 'Dallas - 达拉斯'] },
          'UT': { name: 'Utah (UT) - 犹他州', cities: ['Salt Lake City - 盐湖城 [首府]', 'West Valley City - 西瓦利城'] },
          'VT': { name: 'Vermont (VT) - 佛蒙特州', cities: ['Montpelier - 蒙彼利埃 [首府]', 'Burlington - 伯灵顿'] },
          'VA': { name: 'Virginia (VA) - 弗吉尼亚州', cities: ['Richmond - 里士满 [首府]', 'Virginia Beach - 弗吉尼亚海滩'] },
          'WA': { name: 'Washington (WA) - 华盛顿州', cities: ['Olympia - 奥林匹亚 [首府]', 'Seattle - 西雅图'] },
          'WV': { name: 'West Virginia (WV) - 西弗吉尼亚州', cities: ['Charleston - 查尔斯顿 [首府]', 'Huntington - 亨廷顿'] },
          'WI': { name: 'Wisconsin (WI) - 威斯康星州', cities: ['Madison - 麦迪逊 [首府]', 'Milwaukee - 密尔沃基'] },
          'WY': { name: 'Wyoming (WY) - 怀俄明州', cities: ['Cheyenne - 夏延 [首府]', 'Casper - 卡斯珀'] }
        };

        const sortedStateKeys = [
          'MT', 'DE', 'OR', 'NH', 'AK', 
          'AL', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DC', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'NE', 'NV', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
        ];

        const ageSelect = document.getElementById('age');
        for (let i = 18; i <= 80; i++) {
          const opt = document.createElement('option');
          opt.value = i;
          opt.innerText = i;
          if (i === 25) opt.selected = true; 
          ageSelect.appendChild(opt);
        }

        const regionSelect = document.getElementById('region');
        const citySelect = document.getElementById('city');

        function updateRegions() {
          regionSelect.innerHTML = '<option value="">-- 随机 / Random --</option>';
          citySelect.innerHTML = '<option value="">-- 随机 / Random --</option>';
          
          sortedStateKeys.forEach(key => {
            const item = geoData[key];
            if (item) {
              const opt = document.createElement('option');
              opt.value = key; 
              opt.innerText = item.name; 
              regionSelect.appendChild(opt);
            }
          });
        }

        function updateCities() {
          const region = regionSelect.value;
          citySelect.innerHTML = '<option value="">-- 随机 / Random --</option>';
          if (region && geoData[region]) {
            geoData[region].cities.forEach(c => {
              const opt = document.createElement('option');
              opt.value = c;
              opt.innerText = c; 
              citySelect.appendChild(opt);
            });
          }
        }

        // --- Toast & Copy Logic ---
        let toastTimeout;
        function showToast(msg) {
          const t = document.getElementById('toast');
          t.innerText = msg;
          t.classList.remove('hide');
          t.classList.add('show');
          
          if (toastTimeout) clearTimeout(toastTimeout);
          toastTimeout = setTimeout(() => {
            t.classList.remove('show');
            t.classList.add('hide');
          }, 2000);
        }

        function bindItem(elementId, textValue, isCreditCard = false) {
          const el = document.getElementById(elementId);
          if (!el) return;
          
          el.innerText = textValue;
          
          // 如果不是信用卡区域，添加通用样式
          if (!isCreditCard) {
            el.classList.add('copy-hover');
          }
          
          // 设置点击标题
          el.title = "点击复制 / Click to Copy";
          
          // 重新绑定点击事件（防止多次绑定）
          el.onclick = function() {
            navigator.clipboard.writeText(textValue).then(() => {
              showToast('已复制: ' + (textValue.length > 20 ? textValue.substring(0,15)+'...' : textValue));
            }).catch(err => {
              console.error('Copy failed', err);
              showToast('复制失败');
            });
          };
        }

        async function generate() {
          const btn = document.querySelector('button');
          const originalText = btn.innerText;
          btn.innerText = '生成中... (Generating)';
          btn.disabled = true;

          const params = new URLSearchParams({
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
          document.getElementById('resBasic').innerText = \`\${data.personal.gender}, \${data.personal.age} years old\`;
          
          // 使用 bindItem 自动填充文本并绑定复制事件
          bindItem('resName', data.personal.fullName);
          bindItem('resPhone', data.personal.phone);
          bindItem('resBirthday', data.personal.birthday);
          
          document.getElementById('labelID').innerText = data.ids.name;
          bindItem('resID', data.ids.value);
          
          const email = \`user\${Math.floor(Math.random()*9999)}@example.com\`;
          bindItem('resEmail', email);

          bindItem('resFullAddress', data.location.formatted);
          bindItem('resStateFull', data.location.stateFull);
          bindItem('resCity', data.location.city);
          bindItem('resZip', data.location.zipCode); 
          
          // 信用卡部分 (isCreditCard = true, 样式略有不同)
          bindItem('resCCNum', data.finance.ccNumber, true);
          bindItem('resCCType', data.finance.ccType, true);
          bindItem('resCCExp', data.finance.ccExp, true);
          bindItem('resCCCVV', data.finance.ccCVV, true);
        }

        updateRegions();
      </script>
    </body>
    </html>
  `;
  return c.html(html);
});

export default app;
