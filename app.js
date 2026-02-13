// 三国杀武将抽取器

// 状态
let bannedGenerals = new Set();

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    init();
});

function init() {
    // 显示武将包数量
    updatePackCounts();

    // 绑定事件
    bindEvents();

    // 初始更新
    updateTotalInfo();
    updateModeDesc();
}

// 更新武将包数量显示
function updatePackCounts() {
    for (let key in SGS_DATA) {
        let el = document.querySelector('.pack-count[data-pack="' + key + '"]');
        if (el) {
            el.textContent = SGS_DATA[key].generals.length + '名';
        }
    }
}

// 绑定所有事件
function bindEvents() {
    // 模式切换
    document.getElementById('gameMode').addEventListener('change', function() {
        updateModeDesc();
        togglePlayerCount();
    });

    // 人数变化
    document.getElementById('playerCount').addEventListener('change', updateModeDesc);

    // 武将包选择变化
    let checkboxes = document.querySelectorAll('.pack-checkbox');
    for (let i = 0; i < checkboxes.length; i++) {
        checkboxes[i].addEventListener('change', updateTotalInfo);
    }

    // 全选
    document.getElementById('selectAllPacks').addEventListener('click', function() {
        let boxes = document.querySelectorAll('.pack-checkbox');
        for (let i = 0; i < boxes.length; i++) {
            boxes[i].checked = true;
        }
        updateTotalInfo();
    });

    // 全不选
    document.getElementById('deselectAllPacks').addEventListener('click', function() {
        let boxes = document.querySelectorAll('.pack-checkbox');
        for (let i = 0; i < boxes.length; i++) {
            boxes[i].checked = false;
        }
        updateTotalInfo();
    });

    // 抽取按钮
    document.getElementById('drawBtn').addEventListener('click', drawGenerals);
    document.getElementById('redrawBtn').addEventListener('click', drawGenerals);
    document.getElementById('redrawLandlordBtn').addEventListener('click', drawGenerals);

    // 保存图片按钮
    document.getElementById('saveNormalBtn').addEventListener('click', function() {
        saveAsImage('normalResult', '武将抽取结果');
    });
    document.getElementById('saveLandlordBtn').addEventListener('click', function() {
        saveAsImage('landlordResult', '斗地主武将抽取结果');
    });

    // 禁用武将弹窗
    document.getElementById('openBanModal').addEventListener('click', openBanModal);
    document.getElementById('closeBanModal').addEventListener('click', closeBanModal);
    document.getElementById('confirmBan').addEventListener('click', confirmBan);
    document.getElementById('clearAllBan').addEventListener('click', clearAllBan);

    // 搜索和筛选
    document.getElementById('banSearch').addEventListener('input', renderBanList);
    document.getElementById('banPackFilter').addEventListener('change', renderBanList);

    // 详情弹窗关闭
    document.getElementById('closeDetailModal').addEventListener('click', closeDetailModal);

    // 点击弹窗外部关闭
    document.getElementById('banModal').addEventListener('click', function(e) {
        if (e.target === this) closeBanModal();
    });
    document.getElementById('detailModal').addEventListener('click', function(e) {
        if (e.target === this) closeDetailModal();
    });
}

// 切换人数选择器（斗地主模式禁用）
function togglePlayerCount() {
    let mode = document.getElementById('gameMode').value;
    let playerSelect = document.getElementById('playerCount');

    if (mode === 'landlord') {
        playerSelect.disabled = true;
        playerSelect.value = '3';
    } else {
        playerSelect.disabled = false;
    }
}

// 更新模式描述
function updateModeDesc() {
    let playerCount = parseInt(document.getElementById('playerCount').value);
    let mode = document.getElementById('gameMode').value;
    let descEl = document.getElementById('modeDesc');

    if (mode === 'normal') {
        descEl.textContent = '普通模式：抽取 5×' + playerCount + ' = ' + (5 * playerCount) + ' 名武将';
    } else {
        descEl.textContent = '斗地主模式：固定抽取 5（地主）+ 3（农民A）+ 3（农民B）= 11 名武将';
    }
}

// 更新统计信息
function updateTotalInfo() {
    let selectedPacks = getSelectedPacks();
    let available = getAvailableGenerals(selectedPacks);

    document.getElementById('selectedPackCount').textContent = selectedPacks.length;
    document.getElementById('totalGeneralCount').textContent = available.length;
}

// 获取选中的武将包
function getSelectedPacks() {
    let result = [];
    let checkboxes = document.querySelectorAll('.pack-checkbox:checked');
    for (let i = 0; i < checkboxes.length; i++) {
        result.push(checkboxes[i].value);
    }
    return result;
}

// 获取可用武将
function getAvailableGenerals(packKeys) {
    let result = [];
    for (let i = 0; i < packKeys.length; i++) {
        let key = packKeys[i];
        if (SGS_DATA[key]) {
            let generals = SGS_DATA[key].generals;
            for (let j = 0; j < generals.length; j++) {
                let g = generals[j];
                if (!bannedGenerals.has(g.name)) {
                    result.push({
                        name: g.name,
                        faction: g.faction,
                        hp: g.hp,
                        skills: g.skills,
                        pack: SGS_DATA[key].name,
                        packKey: key
                    });
                }
            }
        }
    }
    return result;
}

// 抽取武将
function drawGenerals() {
    let selectedPacks = getSelectedPacks();

    if (selectedPacks.length === 0) {
        alert('请至少选择一个武将包！');
        return;
    }

    let available = getAvailableGenerals(selectedPacks);

    if (available.length === 0) {
        alert('可用武将数量不足！');
        return;
    }

    let mode = document.getElementById('gameMode').value;

    if (mode === 'normal') {
        let playerCount = parseInt(document.getElementById('playerCount').value);
        let drawCount = 5 * playerCount;

        if (available.length < drawCount) {
            alert('可用武将数量不足！需要 ' + drawCount + ' 名，但只有 ' + available.length + ' 名可用。');
            return;
        }

        let result = shuffle(available).slice(0, drawCount);
        showNormalResult(result);
    } else {
        // 斗地主 5+3+3
        if (available.length < 11) {
            alert('可用武将数量不足！需要 11 名，但只有 ' + available.length + ' 名可用。');
            return;
        }

        let shuffled = shuffle(available);
        showLandlordResult(shuffled.slice(0, 5), shuffled.slice(5, 8), shuffled.slice(8, 11));
    }
}

// 显示普通模式结果
function showNormalResult(generals) {
    document.getElementById('resultSection').style.display = 'block';
    document.getElementById('normalResult').style.display = 'block';
    document.getElementById('landlordResult').style.display = 'none';
    document.getElementById('normalTotal').textContent = generals.length;

    let container = document.getElementById('normalGeneralGrid');
    container.innerHTML = '';

    // 按玩家分组，每5个武将一组
    let playerCount = generals.length / 5;
    for (let i = 0; i < playerCount; i++) {
        let playerGenerals = generals.slice(i * 5, (i + 1) * 5);

        // 创建玩家区域
        let playerSection = document.createElement('div');
        playerSection.className = 'player-section';

        // 玩家标题
        let title = document.createElement('h3');
        title.textContent = '玩家' + (i + 1);
        playerSection.appendChild(title);

        // 武将网格
        let grid = document.createElement('div');
        grid.className = 'general-grid';

        let html = '';
        for (let j = 0; j < playerGenerals.length; j++) {
            html += createCard(playerGenerals[j]);
        }
        grid.innerHTML = html;
        playerSection.appendChild(grid);

        container.appendChild(playerSection);
    }

    // 绑定卡片点击
    let cards = container.querySelectorAll('.general-card');
    for (let i = 0; i < cards.length; i++) {
        cards[i].addEventListener('click', function() {
            showDetail(this.dataset.name);
        });
    }

    // 滚动到结果
    document.getElementById('resultSection').scrollIntoView({ behavior: 'smooth' });
}

// 显示斗地主结果
function showLandlordResult(landlord, farmerA, farmerB) {
    document.getElementById('resultSection').style.display = 'block';
    document.getElementById('normalResult').style.display = 'none';
    document.getElementById('landlordResult').style.display = 'block';

    // 渲染三个池
    renderPool('landlordGrid', landlord);
    renderPool('farmerAGrid', farmerA);
    renderPool('farmerBGrid', farmerB);

    // 滚动到结果
    document.getElementById('resultSection').scrollIntoView({ behavior: 'smooth' });
}

// 渲染武将池
function renderPool(elementId, generals) {
    let html = '';
    for (let i = 0; i < generals.length; i++) {
        html += createCard(generals[i]);
    }

    let grid = document.getElementById(elementId);
    grid.innerHTML = html;

    let cards = grid.querySelectorAll('.general-card');
    for (let i = 0; i < cards.length; i++) {
        cards[i].addEventListener('click', function() {
            showDetail(this.dataset.name);
        });
    }
}

// 创建武将卡片
function createCard(g) {
    let factionClass = 'faction-' + getFactionCode(g.faction);
    let skillsText = getSkillsText(g.skills);
    return '<div class="general-card" data-name="' + g.name + '">' +
        '<div class="general-header">' +
            '<span class="general-name">' + g.name + '</span>' +
            '<span class="general-faction ' + factionClass + '">' + g.faction + '</span>' +
        '</div>' +
        '<div class="general-info">' +
            '<span class="general-hp">' + g.hp + '</span>' +
            '<span class="general-pack">' + g.pack + '</span>' +
        '</div>' +
        '<div class="general-skills-preview">' + skillsText + '</div>' +
    '</div>';
}

// 获取势力代码
function getFactionCode(faction) {
    if (faction === '魏') return 'wei';
    if (faction === '蜀') return 'shu';
    if (faction === '吴') return 'wu';
    return 'qun';
}

// 显示武将详情
function showDetail(name) {
    let general = null;
    let packName = '';

    for (let key in SGS_DATA) {
        let generals = SGS_DATA[key].generals;
        for (let i = 0; i < generals.length; i++) {
            if (generals[i].name === name) {
                general = generals[i];
                packName = SGS_DATA[key].name;
                break;
            }
        }
        if (general) break;
    }

    if (!general) return;

    document.getElementById('detailName').textContent = general.name;

    let factionEl = document.getElementById('detailFaction');
    factionEl.textContent = general.faction;
    factionEl.className = 'detail-faction faction-' + getFactionCode(general.faction);

    document.getElementById('detailHp').textContent = '体力: ' + general.hp + ' | ' + packName;

    // 格式化技能
    let skillsHtml = formatSkills(general.skills);
    document.getElementById('detailSkills').innerHTML = skillsHtml;

    document.getElementById('detailModal').style.display = 'flex';
}

// 判断是否为真正的技能名
function isSkillName(text, fullText, position) {
    // 常见技能名列表
    const commonSkillNames = ['奸雄','护驾','反馈','鬼才','刚烈','突袭','裸衣','天妒','遗计','倾国','洛神','仁德','激将','武圣','咆哮','观星','空城','龙胆','马术','铁骑','集智','奇才','制衡','救援','奇袭','克己','苦肉','英姿','反间','国色','流离','谦逊','连营','结姻','枭姬','急救','青囊','无双','离间','闭月','神速','据守','烈弓','狂骨','天香','红颜','不屈','雷击','鬼道','黄天','蛊惑','行殇','放逐','颂威','祸首','再起','巨象','烈刃','好施','缔盟','英魂','酒池','肉林','崩坏','暴虐','完杀','乱武','帷幕','驱虎','节命','强袭','八阵','火计','看破','连环','涅槃','猛进','乱击','血裔','双雄','巧变','屯田','凿险','急袭','享乐','放权','若愚','挑衅','志继','魂姿','制霸','直谏','固政','化身','新生','悲歌','断肠','落英','酒诗','镇军','绝情','伤逝','恩怨','眩惑','无言','举荐','散谣','制蛮','旋风','破军','甘露','补益','明策','智迟','陷阵','禁酒','奇策','智愚','贞烈','秘计','将驰','父魂','当先','伏枥','潜袭','安恤','追忆','疠火','醇醪','弓骑','解烦','恃勇','自守','宗室','权计','自立','排异','称象','仁心','峻刑','御策','绝策','灭计','焚城','惴恐','求援','陷嗣','龙吟','巧说','纵适','夺刀','暗箭','胆守','纵玄','直言','司敌','慎断','勇略','定品','法恩','宴诛','兴学','诏缚','强识','献图','忠勇','谮毁','骄矜','慎行','秉壹','渐营','矢北','窃听','献州','燕语','孝德','恢拓','明鉴','兴衰','讨袭','活墨','佐定','振赡','匡弼','怃戎','矢志','穿心','锋箭','寝情','贿生','督粮','腹鳞','怀异','急攻','饰非'];

    // 检查是否在常见技能名列表中
    if (commonSkillNames.indexOf(text) !== -1) {
        return true;
    }

    // 检查是否是句首（技能描述的开头）
    if (position === 0) {
        return true;
    }

    // 检查前面是否是句号、分号、引号等标点
    var prevChar = fullText.charAt(position - 1);
    var endChars = ['。', '；', '】', '」', '』', ')', '）'];
    if (endChars.indexOf(prevChar) !== -1) {
        return true;
    }

    // 排除常见的非技能名（选择一项、选择两项、选择三项等）
    if (text.indexOf('选择') === 0 && text.indexOf('项') === text.length - 1) {
        return false;
    }
    var nonSkillNames = ['可以', '然后', '令其', '当你', '锁定技', '限定技', '觉醒技', '主公技'];
    if (nonSkillNames.indexOf(text) !== -1) {
        return false;
    }

    return false;
}

// 格式化技能描述
function formatSkills(skills) {
    if (!skills) return '';

    let matches = [];
    let skillPattern = /([\u4e00-\u9fa5]{2,4})：/g;
    let match;

    // 找到所有技能名称的位置
    while ((match = skillPattern.exec(skills)) !== null) {
        let skillName = match[1];
        let position = match.index;

        // 验证是否为真正的技能名
        if (isSkillName(skillName, skills, position)) {
            matches.push({
                name: skillName,
                index: position,
                fullMatch: match[0]
            });
        }
    }

    let html = '';

    if (matches.length === 0) {
        html = '<p>' + skills + '</p>';
    } else {
        for (let i = 0; i < matches.length; i++) {
            let current = matches[i];
            let next = matches[i + 1];

            let descStart = current.index + current.fullMatch.length;
            let descEnd = next ? next.index : skills.length;
            let desc = skills.substring(descStart, descEnd).trim();

            html += '<p><strong>' + current.name + '</strong>：' + desc + '</p>';
        }
    }

    return html;
}

// 获取技能纯文本（用于卡片显示）
function getSkillsText(skills) {
    if (!skills) return '';

    let matches = [];
    let skillPattern = /([\u4e00-\u9fa5]{2,4})：/g;
    let match;

    while ((match = skillPattern.exec(skills)) !== null) {
        let skillName = match[1];
        let position = match.index;

        if (isSkillName(skillName, skills, position)) {
            matches.push({
                name: skillName,
                index: position,
                fullMatch: match[0]
            });
        }
    }

    if (matches.length === 0) {
        return skills;
    }

    let result = [];
    for (let i = 0; i < matches.length; i++) {
        let current = matches[i];
        let next = matches[i + 1];

        let descStart = current.index + current.fullMatch.length;
        let descEnd = next ? next.index : skills.length;
        let desc = skills.substring(descStart, descEnd).trim();

        result.push('<strong>' + current.name + '</strong>：' + desc);
    }

    return result.join('<br><br>');
}

function closeDetailModal() {
    document.getElementById('detailModal').style.display = 'none';
}

// ========== 禁用武将功能 ==========

function openBanModal() {
    // 初始化武将包筛选
    let select = document.getElementById('banPackFilter');
    select.innerHTML = '<option value="all">全部武将包</option>';
    for (let key in SGS_DATA) {
        let option = document.createElement('option');
        option.value = key;
        option.textContent = SGS_DATA[key].name;
        select.appendChild(option);
    }

    renderBanList();
    document.getElementById('banModal').style.display = 'flex';
}

function closeBanModal() {
    document.getElementById('banModal').style.display = 'none';
}

function renderBanList() {
    let search = document.getElementById('banSearch').value.toLowerCase();
    let packFilter = document.getElementById('banPackFilter').value;
    let list = document.getElementById('banList');

    let html = '';

    for (let key in SGS_DATA) {
        if (packFilter !== 'all' && packFilter !== key) continue;

        let generals = SGS_DATA[key].generals;
        for (let i = 0; i < generals.length; i++) {
            let g = generals[i];
            if (search && g.name.toLowerCase().indexOf(search) === -1) continue;

            let checked = bannedGenerals.has(g.name) ? 'checked' : '';
            html += '<div class="ban-item">' +
                '<input type="checkbox" value="' + g.name + '" ' + checked + '>' +
                '<div class="ban-item-info">' +
                    '<span class="ban-item-name">' + g.name + '</span>' +
                    '<span class="ban-item-pack">' + SGS_DATA[key].name + '</span>' +
                '</div>' +
            '</div>';
        }
    }

    list.innerHTML = html || '<div style="padding: 20px; text-align: center; color: #999;">没有找到匹配的武将</div>';
}

function confirmBan() {
    bannedGenerals.clear();

    let checkboxes = document.querySelectorAll('#banList input[type="checkbox"]:checked');
    for (let i = 0; i < checkboxes.length; i++) {
        bannedGenerals.add(checkboxes[i].value);
    }

    document.getElementById('banCount').textContent = '(' + bannedGenerals.size + ')';
    updateTotalInfo();
    closeBanModal();
}

function clearAllBan() {
    let checkboxes = document.querySelectorAll('#banList input[type="checkbox"]');
    for (let i = 0; i < checkboxes.length; i++) {
        checkboxes[i].checked = false;
    }
}

// ========== 工具函数 ==========

// Fisher-Yates 洗牌
function shuffle(array) {
    let arr = array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
    }
    return arr;
}

// ========== 保存为图片功能 ==========

function saveAsImage(elementId, fileName) {
    let element = document.getElementById(elementId);
    if (!element) {
        alert('找不到要保存的内容');
        return;
    }

    // 检查 html2canvas 是否加载
    if (typeof html2canvas === 'undefined') {
        alert('图片库加载中，请稍后再试');
        return;
    }

    // 显示提示
    let btn = event.target;
    let originalText = btn.textContent;
    btn.textContent = '生成中...';
    btn.disabled = true;

    // 使用 html2canvas 生成图片
    html2canvas(element, {
        backgroundColor: '#f5f5f5',
        scale: 2, // 高清图片
        useCORS: true,
        allowTaint: true,
        logging: false
    }).then(function(canvas) {
        // 转换为图片并下载
        let link = document.createElement('a');
        link.download = fileName + '_' + new Date().getTime() + '.png';
        link.href = canvas.toDataURL('image/png');
        link.click();

        // 恢复按钮
        btn.textContent = originalText;
        btn.disabled = false;
    }).catch(function(err) {
        console.error('保存图片失败:', err);
        alert('保存图片失败，请重试');
        btn.textContent = originalText;
        btn.disabled = false;
    });
}
