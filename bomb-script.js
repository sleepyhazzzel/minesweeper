// 定義全局變數或常數
const rowLevel = [10, 14, 18]
const colLevel = [10, 16, 22]
const bombLevel = [10, 30, 70]
let rowTotal = 10     // 列數
let colTotal = 10     // 欄數
let bombsTotal = 10   // 炸彈總數
let bombsRemain = 10  // 剩下的炸彈
let bombsArray = []   // 炸彈陣列
let score = {       // 分數紀錄
    Easy: 1000,
    Normal: 1000,
    Difficult: 1000
}

// 轉字串 (localStorage 只接受字串)
let scoreString = JSON.stringify(score)
// 建立 localStorage
localStorage.setItem('scoreItem', scoreString)
// 抓取 localStorage
// let getData = localStorage.getItem('scoreItem')
let getData = localStorage.scoreItem // 簡寫
// 轉物件
let scoreData = JSON.parse(getData)

function info() {
    $('#info').on('click', function () {
        Swal.fire({
            heightAuto: false,
            imageUrl: "./images/info.gif",
            imageWidth: "180",
            imageHeight: "auto",
            confirmButtonColor: "#3085d6",
        })
    })
}

// 重新開始目前遊戲
function restart() {
    $('#restart').on('click', function () {
        clearInterval(time)
        startGame($('#select option:selected').val())
    })
}

// select 選擇難度
function reset() {
    $('#select').on('change', function () {
        clearInterval(time)
        let val = $(this).val()
        startGame(val)
    })
}

// 生成網格
function generateGrid() {
    let gridHtml = ''
    for (let i = 0; i < rowTotal; i++) {
        gridHtml += '<tr>'
        for (let j = 0; j < colTotal; j++) {
            gridHtml += `<td class="box" data-index="${i * colTotal + j}"></td>`
        }
        gridHtml += '</tr>'
    }
    // 寫入html
    $('#grid').html(gridHtml)
}

// 隨機生成炸彈
function generateBombs() {
    let bombs = new Set()
    // Set() 物件中每個索引都是唯一值，不會重複出現相同值
    // .size 是 Set 的屬性，物件內的總數
    // .size 相當於 Array的 .length

    while (bombs.size < bombsTotal) {
        const bomb = Math.floor(Math.random() * (rowTotal * colTotal))
        bombs.add(bomb)
        // .add 是 Set 的屬性，在物件中新增
        // .add 相當於 Array的 .push()
    }
    return Array.from(bombs)
    // Array.from() 將 Set() 轉換成陣列 
}

// 顯示難度
function showLevel(lv) {
    $('#select').children().eq(lv).prop('selected', true)
    // safari 要用.prop() 不能用.attr()
    // .prop() => property，是 DOM 屬性，值可以是字串、布林或數字
    // .attr() => attribute，是 HTML 特性，值只能是字串
}

// 開始計時
// setInterval 在 function 裡，所以自定義 time 要寫在外面 clearInterval 才呼叫得到
let time = 0
let sec = 0
function timer() {
    sec = -1
    time = setInterval(function () {
        sec++
        let timer = sec.toString().padStart(3, '0').split("")
        $('#timer').children().eq(0).attr('src', `./images/num-${timer[0]}.png`)
        $('#timer').children().eq(1).attr('src', `./images/num-${timer[1]}.png`)
        $('#timer').children().eq(2).attr('src', `./images/num-${timer[2]}.png`)
        return sec
    }, 1000)
}

// 計算周圍的炸彈數量
function bombsNearby(row, col, bombsArray) {
    let count = 0

    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            let row_ = row + i
            let col_ = col + j

            // 邊界判定(避免隔列讀取)
            // ex: 79 會讀取 [68, 69, 70, 78, 79, 80, 88, 89, 90]
            // [70, 80, 90] 是不需要讀取的
            if (col_ >= 0 && col_ < colTotal && row_ >= 0 && row_ < rowTotal) {
                if (bombsArray.includes(row_ * colTotal + col_)) {
                    count++
                }
            }
        }
    }
    return count;
}

// 打開格子
function openBox(row, col) {
    // 邊界判定
    if (row < 0 || col < 0 || row >= rowTotal || col >= colTotal) {
        return;
    }

    const index = row * colTotal + col
    const box = $(`td[data-index="${index}"]`)

    // 如果已經打開過或者是旗子，則停止遞迴
    if (box.hasClass('opened') || box.hasClass('flag')) {
        return;
    }

    // 顯示數字
    const num = bombsNearby(row, col, bombsArray);
    box.css('background', `url(./images/0${num}.png) center/cover no-repeat`)
        .removeClass('box')
        .addClass('opened')

    // 如果是 0，則遞迴打開周圍的格子
    if (num === 0) {
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                openBox(row + i, col + j)
            }
        }
    }
}

// 炸彈計數
function countBomb(b) {
    let bombs = b.toString().padStart(3, '0').split("")
    if (bombs[1] === "-") {
        bombs[0] = "none"
    }
    $('#bomb').children().eq(0).attr('src', `./images/num-${bombs[0]}.png`)
    $('#bomb').children().eq(1).attr('src', `./images/num-${bombs[1]}.png`)
    $('#bomb').children().eq(2).attr('src', `./images/num-${bombs[2]}.png`)

}

// 失敗條件
function lose() {
    // 炸彈全部顯示
    bombsArray.forEach(function (index) {
        let box = $(`td[data-index="${index}"]`)
        // []是CSS的選擇器
        // <td data-index="0"></td>
        // td[data-index="0"] => 選擇 td 裡是 data-index="0"
        if (!box.hasClass('flag')) {
            box.removeClass('box').addClass('bomb')
        }
    })
    // 插錯旗子
    $('.flag').each(function () {
        if (!bombsArray.includes($(this).data("index"))) {
            $(this).removeClass('flag').addClass('not-bomb')
        }
    })

    // 數字全部顯示
    // $('.box').each(function () {
    //     const rowNum = Math.floor($(this).data("index") / colTotal)
    //     const colNum = $(this).data("index") % colTotal
    //     openBox(rowNum, colNum)
    // })

    clearInterval(time)

    Swal.fire({
        // 避免跟遊戲主體 #game 的 display:flex 打架
        heightAuto: false,
        icon: "error",
        title: "Oops...",
        showClass: {
            popup: `animate__animated
                    animate__bounceIn`
        },
        hideClass: {
            popup: `animate__animated
                    animate__bounceOut`
        },
        showCancelButton: true,
        confirmButtonText: '<i class="fa-solid fa-rotate-right" style="font-size:32px"></i>',
        cancelButtonText: '<i class="fa-solid fa-xmark" style="font-size:32px"></i>',
        confirmButtonColor: "#3085d6",
    }).then((result) => {
        if (result.isConfirmed) {
            startGame($('#select option:selected').val())
        }
    })
}

// 勝利條件
function victory() {
    let flagIsBomb = true
    let boxIsBomb = true
    // 1.全部炸彈都被標示，且皆正確
    // 2.炸彈沒標示完，但剩餘皆為炸彈
    if (($('.flag').length === bombsTotal) || ($('.flag').length + $('.box').length === bombsTotal)) {
        // 如果旗子都有插對
        $('.flag').each(function () {
            if (!bombsArray.includes($(this).data("index"))) {
                // 如果旗子的位置不是炸彈，設定 flagIsBomb 為 false 並中斷循環
                flagIsBomb = false
                return false
            }
        })

        $('.box').each(function () {
            if (!bombsArray.includes($(this).data("index"))) {
                boxIsBomb = false
                return false
            }
        })


        if (flagIsBomb && boxIsBomb) {
            console.log(flagIsBomb, boxIsBomb)
            clearInterval(time)
            console.log(flagIsBomb, boxIsBomb)
            // 辨識最快完成速度
            let level = $('#select option:selected').text()
            if (sec < score[level]) {
                score[level] = sec
            }

            // 更新 localStorage 的資料
            scoreString = JSON.stringify(score)
            localStorage.setItem('scoreItem', scoreString)
            // 更新遊戲介面最快紀錄
            $('#level').text(level)
            $('#sec').text(sec)

            Swal.fire({
                heightAuto: false,
                icon: "success",
                title: "Congrats!",
                html: `You complete 
                <span style="color:#3085d6;">${level}</span> level in 
                <span style="color:#3085d6;">${sec}s</span>.`,
                footer: `The top record of ${level} level was <i>${score[level]}s</i>.`,
                // 物件object 取 value => obj.name = obj['name']
                background: "#fff url(./images/congrats.gif) center/cover no-repeat",
                showClass: {
                    popup: `animate__animated
                            animate__bounceIn`
                },
                hideClass: {
                    popup: `animate__animated
                            animate__bounceOut`
                },
                showCancelButton: true,
                confirmButtonText: '<i class="fa-solid fa-rotate-right" style="font-size:32px"></i>',
                cancelButtonText: '<i class="fa-solid fa-xmark" style="font-size:32px"></i>',
                confirmButtonColor: "#3085d6",
            }).then((result) => {
                if (result.isConfirmed) {
                    startGame($('#select option:selected').val())
                }
            })
        }
    }
}

// 點擊事件 ( safari 要用.on() )
function clickEvent() {
    $('.box').on('mousedown', function (e) {
        // 滑鼠左鍵
        if (e.button === 0) {
            let dataIndex = $(this).data("index")
            const row = Math.floor(dataIndex / colTotal) // 第?列            
            const col = dataIndex % colTotal             // 第?欄
            // 如果是炸彈
            if (bombsArray.includes(dataIndex)) {
                lose()
            }
            // 如果不是炸彈
            else {
                openBox(row, col)
                victory()
            }
        }

        // 滑鼠右鍵(插旗子)
        else if (e.button === 2) {
            if ($(this).hasClass('flag')) {
                $(this).removeClass('flag').addClass('box')
                bombsRemain++
                countBomb(bombsRemain)
            } else {
                $(this).removeClass('box').addClass('flag')
                bombsRemain--
                countBomb(bombsRemain)
            }
        }
        victory()
    })
}

// 選擇難度
$(document).ready(function () {
    generateGrid();
    reset();
    info();

    Swal.fire({
        heightAuto: false,
        // icon: "question",
        imageUrl: "./images/smile.gif",
        imageWidth: "180",
        imageHeight: "auto",
        title: "—— Start ——",
        customClass: {
            image: 'img-class',
            title: 'title-class',
        },
        showClass: {
            popup: `animate__animated
                    animate__bounceIn`
        },
        hideClass: {
            popup: `animate__animated
                    animate__bounceOut`
        },
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: 'Easy ★',
        denyButtonText: "Normal ★★",
        cancelButtonText: "Difficult ★★★",
        confirmButtonColor: "#3085d6",
        denyButtonColor: "#28B463",
        cancelButtonColor: "#d33",
    }).then((result) => {
        if (result.isConfirmed) {
            startGame(0)
        } else if (result.isDenied) {
            startGame(1)
        } else if (result.isDismissed) {
            startGame(2)
        }
    })
})

// 開始遊戲
function startGame(lv) {
    rowTotal = rowLevel[lv]      // 列數
    colTotal = colLevel[lv]      // 欄數
    bombsTotal = bombLevel[lv]   // 炸彈總數
    bombsRemain = bombLevel[lv]  // 剩下的炸彈
    bombsArray = generateBombs(bombsTotal) // 炸彈陣列

    restart();
    generateGrid();
    generateBombs();
    showLevel(lv);
    timer();
    countBomb(bombsTotal);
    clickEvent();

    // 遊戲介面最快紀錄
    // Level
    let nowLevel = $('#select option:selected').text()
    $('#level').text(nowLevel)
    // sec
    if (score[nowLevel] === 1000) {
        $('#sec').text('?')
    } else {
        $('#sec').text(score[nowLevel])
    }
}