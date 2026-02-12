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

    let html = '';
    for (let i = 0; i < generals.length; i++) {
        html += createCard(generals[i]);
    }

    let grid = document.getElementById('normalGeneralGrid');
    grid.innerHTML = html;

    // 绑定卡片点击
    let cards = grid.querySelectorAll('.general-card');
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
    return '<div class="general-card" data-name="' + g.name + '">' +
        '<div class="general-header">' +
            '<span class="general-name">' + g.name + '</span>' +
            '<span class="general-faction ' + factionClass + '">' + g.faction + '</span>' +
        '</div>' +
        '<div class="general-info">' +
            '<span class="general-hp">' + g.hp + '</span>' +
            '<span class="general-pack">' + g.pack + '</span>' +
        '</div>' +
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

// 格式化技能描述
function formatSkills(skills) {
    // 按技能名称分割（技能名称后跟冒号）
    // 改进正则表达式，确保正确分割技能描述
    let parts = skills.split(/(?=^|[^\u4e00-\u9fa5])([\u4e00-\u9fa5]+：)/);
    let html = '';
    
    // 处理分割结果
    for (let i = 1; i < parts.length; i += 2) {
        let skillHeader = parts[i];
        let desc = (parts[i + 1] || '').trim();
        
        if (skillHeader) {
            // 提取技能名称（冒号前的部分）
            let nameIdx = skillHeader.indexOf('：');
            if (nameIdx > 0) {
                let name = skillHeader.substring(0, nameIdx);
                html += '<p><strong>' + name + '</strong>：' + desc + '</p>';
            } else {
                html += '<p>' + skillHeader + desc + '</p>';
            }
        }
    }
    
    // 如果没有分割成功，直接显示原始技能描述
    if (!html) {
        html = '<p>' + skills + '</p>';
    }
    
    return html;
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
