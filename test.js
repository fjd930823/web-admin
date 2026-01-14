const puppeteer = require('puppeteer');

// 辅助函数：替代 waitForTimeout
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function login123Pan() {
  const browser = await puppeteer.launch({
    headless: false, // 设置为false以便观察过程
    slowMo: 50, // 减慢操作速度，更像人类行为
  });

  try {
    const page = await browser.newPage();
    
    // 设置视口大小
    await page.setViewport({ width: 1280, height: 800 });
    
    // 访问登录页面
    console.log('正在打开登录页面...');
    await page.goto('https://www.123panfx.com/?user-login.htm', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // 填写用户名（邮箱）
    console.log('填写用户名...');
    await page.waitForSelector('input[name="email"]', { timeout: 10000 });
    await page.type('input[name="email"]', '312653114@qq.com ', { delay: 100 });

    // 填写密码
    console.log('填写密码...');
    await page.type('input[name="password"]', 'mfy@666888', { delay: 100 });

    // 等待一下，确保表单填写完成
    await sleep(1000);

    // 先尝试点击验证按钮（如果需要的话）
    console.log('尝试触发验证...');
    const captchaButtons = await page.$$('div[class*="radar"]');
    if (captchaButtons.length > 0) {
      console.log('找到验证触发按钮，点击...');
      await captchaButtons[0].click();
      await sleep(2000);
    }

    // 处理 Geetest 滑块验证
    console.log('开始处理滑块验证...');
    await handleGeetestSlider(page);

    // 点击登录按钮
    console.log('点击登录按钮...');
    const loginButtons = await page.$$('button');
    for (const btn of loginButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes('登录')) {
        await btn.click();
        break;
      }
    }

    // 等待登录完成（根据实际情况调整）
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {
      console.log('可能已登录或页面未跳转');
    });

    // 检查是否登录成功
    const currentUrl = page.url();
    console.log('当前页面:', currentUrl);

    // 可以根据 URL 或页面元素判断是否登录成功
    if (!currentUrl.includes('user-login')) {
      console.log('✓ 登录成功！');
    } else {
      console.log('✗ 登录可能失败，请检查');
    }

    // 保持浏览器打开以便查看结果
    console.log('浏览器将在10秒后关闭...');
    await sleep(10000);

  } catch (error) {
    console.error('登录过程出错:', error.message);
  } finally {
    await browser.close();
  }
}

/**
 * 处理 Geetest 滑块验证
 * 这是最复杂的部分，需要模拟人类滑动行为
 */
async function handleGeetestSlider(page) {
  try {
    console.log('等待滑块验证加载...');
    await sleep(2000);

    // 尝试多种可能的选择器来找到滑块按钮
    const possibleSelectors = [
      '.geetest_slider_button',
      '.geetest_btn',
      'div[class*="slider_button"]',
      'div[class*="btn"]',
      // Geetest 可能在 iframe 中
    ];

    let slider = null;
    let sliderSelector = null;

    // 尝试每个选择器
    for (const selector of possibleSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 });
        slider = await page.$(selector);
        if (slider) {
          sliderSelector = selector;
          console.log(`找到滑块元素: ${selector}`);
          break;
        }
      } catch (e) {
        // 继续尝试下一个
      }
    }

    // 如果在主页面找不到，可能在 iframe 中
    if (!slider) {
      console.log('在主页面未找到滑块，尝试查找 iframe...');
      const frames = page.frames();
      console.log(`找到 ${frames.length} 个 frame`);
      
      for (const frame of frames) {
        for (const selector of possibleSelectors) {
          try {
            const element = await frame.$(selector);
            if (element) {
              console.log(`在 iframe 中找到滑块: ${selector}`);
              // 对于 iframe 中的元素，我们需要直接操作
              const box = await element.boundingBox();
              if (box) {
                await performSlideInIframe(page, box);
                await sleep(3000);
                console.log('滑块操作完成，请查看结果');
                return;
              }
            }
          } catch (e) {
            // 继续
          }
        }
      }
    }

    if (!slider) {
      throw new Error('未找到滑块元素，请手动操作');
    }

    // 等待元素完全渲染
    await sleep(1000);

    // 尝试多次获取滑块的边界框
    let sliderBox = null;
    for (let i = 0; i < 5; i++) {
      sliderBox = await slider.boundingBox();
      if (sliderBox) break;
      console.log(`等待滑块渲染... (${i + 1}/5)`);
      await sleep(500);
    }

    if (!sliderBox) {
      console.log('主页面无法获取滑块位置，尝试在 iframe 中查找...');
      
      // 尝试在 iframe 中查找并操作
      const frames = page.frames();
      for (const frame of frames) {
        try {
          const frameSlider = await frame.$(sliderSelector);
          if (frameSlider) {
            const frameBox = await frameSlider.boundingBox();
            if (frameBox) {
              console.log(`在 iframe 中找到可用的滑块`);
              await performSlideInIframe(page, frameBox);
              await sleep(3000);
              console.log('滑块操作完成');
              return;
            }
          }
        } catch (e) {
          // 继续尝试下一个 frame
        }
      }
      
      throw new Error('无法获取滑块位置，请手动操作');
    }

    // 计算滑动距离
    const distance = 260; // Geetest 标准宽度
    
    console.log(`滑块位置: (${sliderBox.x}, ${sliderBox.y}), 宽度: ${sliderBox.width}, 高度: ${sliderBox.height}`);
    console.log(`准备滑动距离: ${distance}px`);

    // 模拟人类滑动轨迹
    await slideWithHumanBehavior(page, sliderBox, distance);

    // 等待验证结果
    console.log('等待验证结果...');
    await sleep(3000);

    console.log('滑块操作完成，如果失败请手动处理');

  } catch (error) {
    console.error('处理滑块验证时出错:', error.message);
    console.log('请手动完成滑块验证（预留30秒）...');
    // 给用户30秒时间手动处理
    await sleep(30000);
  }
}

/**
 * 在 iframe 中执行滑动操作
 */
async function performSlideInIframe(page, sliderBox) {
  const startX = sliderBox.x + sliderBox.width / 2;
  const startY = sliderBox.y + sliderBox.height / 2;
  const distance = 260;

  console.log(`iframe 滑块位置: (${Math.round(startX)}, ${Math.round(startY)})`);
  console.log(`iframe 滑块尺寸: ${sliderBox.width}x${sliderBox.height}`);

  // 移动到滑块
  await page.mouse.move(startX, startY);
  await sleep(200);

  // 按下鼠标
  console.log('iframe: 按下鼠标');
  await page.mouse.down();
  await sleep(200);

  // 生成滑动轨迹
  const steps = generateHumanTrack(distance);
  console.log(`iframe: 生成 ${steps.length} 步滑动轨迹`);
  let currentX = startX;
  
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    currentX += step;
    const randomY = startY + (Math.random() - 0.5) * 3;
    await page.mouse.move(currentX, randomY);
    await sleep(Math.random() * 20 + 10);
    
    if (i % 20 === 0) {
      console.log(`iframe 滑动进度: ${Math.round((i / steps.length) * 100)}%`);
    }
  }

  console.log('iframe: 滑动完成，准备释放');

  // 超过再回退
  await page.mouse.move(currentX + 5, startY);
  await sleep(50);
  await page.mouse.move(currentX, startY);
  await sleep(150);

  // 释放鼠标
  console.log('iframe: 释放鼠标');
  await page.mouse.up();
  
  console.log(`iframe 最终位置: (${Math.round(currentX)}, ${Math.round(startY)}), 总移动: ${Math.round(currentX - startX)}px`);
}

/**
 * 模拟人类滑动行为
 * @param {Page} page - Puppeteer页面对象
 * @param {Object} sliderBox - 滑块边界框 {x, y, width, height}
 * @param {number} distance - 滑动距离
 */
async function slideWithHumanBehavior(page, sliderBox, distance) {
  // 起始位置
  const startX = sliderBox.x + sliderBox.width / 2;
  const startY = sliderBox.y + sliderBox.height / 2;

  console.log(`开始滑动: 起点 (${Math.round(startX)}, ${Math.round(startY)})`);

  // 移动鼠标到滑块
  await page.mouse.move(startX, startY);
  await sleep(200);

  // 按下鼠标
  console.log('按下鼠标...');
  await page.mouse.down();
  await sleep(200);

  // 生成人类滑动轨迹
  const steps = generateHumanTrack(distance);
  console.log(`生成 ${steps.length} 步滑动轨迹`);
  
  let currentX = startX;
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    currentX += step;
    // 添加垂直方向的小幅抖动
    const randomY = startY + (Math.random() - 0.5) * 3;
    await page.mouse.move(currentX, randomY);
    await sleep(Math.random() * 20 + 10); // 随机延迟
    
    // 每20步输出一次进度
    if (i % 20 === 0) {
      console.log(`滑动进度: ${Math.round((i / steps.length) * 100)}%`);
    }
  }

  console.log('滑动完成，准备释放...');

  // 稍微超过目标位置，再回退（模拟人类行为）
  await page.mouse.move(currentX + 5, startY);
  await sleep(50);
  await page.mouse.move(currentX, startY);
  await sleep(150);

  // 释放鼠标
  console.log('释放鼠标');
  await page.mouse.up();
  
  console.log(`最终位置: (${Math.round(currentX)}, ${Math.round(startY)}), 总移动: ${Math.round(currentX - startX)}px`);
}

/**
 * 生成人类滑动轨迹
 * 先加速，后减速，带随机抖动
 */
function generateHumanTrack(distance) {
  const tracks = [];
  let current = 0;
  let mid = distance * 0.8; // 80%的位置开始减速
  
  // 加速阶段
  while (current < mid) {
    const move = Math.random() * 5 + 2; // 2-7px
    tracks.push(move);
    current += move;
  }
  
  // 减速阶段
  while (current < distance) {
    const move = Math.random() * 2 + 1; // 1-3px
    tracks.push(move);
    current += move;
  }
  
  return tracks;
}

// 运行登录函数
login123Pan().catch(console.error);
