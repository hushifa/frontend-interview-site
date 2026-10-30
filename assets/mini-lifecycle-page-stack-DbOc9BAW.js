var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>从列表页点进详情页，再点返回，背后是一个页面栈在变化：打开详情页时把它压到栈顶，列表页被隐藏；返回时详情页被弹出销毁，列表页重新显示。</p>
<p>生命周期分两层。应用级的 <code>onLaunch</code> 在小程序初始化完成时触发，全局只触发一次；<code>onShow</code>、<code>onHide</code> 在切到前台、后台时触发。页面级的 <code>onLoad</code> 和 <code>onReady</code> 一个页面只触发一次，分别表示页面加载和初次渲染完成；<code>onShow</code>、<code>onHide</code> 在页面显示、隐藏时反复触发；<code>onUnload</code> 在页面销毁时触发。</p>
<p>跳转方式决定页面栈怎么变。<code>navigateTo</code> 保留当前页、压入新页，栈最多十层；<code>redirectTo</code> 把栈顶页销毁后换成新页；<code>navigateBack</code> 从栈顶依次弹出；<code>switchTab</code> 只能去 tabBar 页，会把非 tabBar 页都销毁；<code>reLaunch</code> 销毁所有页面，再打开目标页。</p>
<p>要注意，<code>onShow</code> 每次页面重新可见都会触发，只该放刷新数据这类操作，一次性的初始化放在 <code>onLoad</code>。另外 <code>getCurrentPages()</code> 只能读页面栈，不要去修改它。</p>
</blockquote>
<h2>应用和页面各有哪些生命周期</h2>
<p>应用的生命周期写在 <code>app.js</code> 的 <code>App()</code> 里。官方文档的定义是：<code>onLaunch</code> 在小程序初始化完成时触发，全局只触发一次；<code>onShow</code> 在小程序启动或从后台进入前台时触发；<code>onHide</code> 在小程序从前台进入后台时触发。另外还有 <code>onError</code>、<code>onPageNotFound</code> 这类监听函数。</p>
<p>页面的生命周期写在 <code>Page()</code> 里，含义如下：</p>
<ul>
<li><code>onLoad(query)</code>：页面加载时触发，一个页面只调用一次，参数里能拿到打开页面时路径上带的参数。</li>
<li><code>onShow</code>：页面显示或切入前台时触发。</li>
<li><code>onReady</code>：页面初次渲染完成时触发，一个页面只调用一次，表示可以和视图层交互了。文档提醒，<code>wx.setNavigationBarTitle</code> 这类设置界面内容的 API 要在 <code>onReady</code> 之后调用。</li>
<li><code>onHide</code>：页面隐藏或切入后台时触发，例如 <code>navigateTo</code> 到别的页面、切换 tab、小程序进入后台。</li>
<li><code>onUnload</code>：页面卸载时触发，例如 <code>redirectTo</code> 或 <code>navigateBack</code> 离开这个页面。</li>
</ul>
<p>“页面路由”文档还给出了新页面创建时的顺序：先是页面里自定义组件的 <code>created</code>、<code>attached</code> 和 <code>pageLifetimes.show</code>，然后才是页面的 <code>onLoad</code>、<code>onShow</code>。所以页面刚加载时，组件已经挂上了。</p>
<h2>为什么初始化不要放在 onShow</h2>
<p><code>onShow</code> 不只在页面第一次出现时触发。官方文档说明，已经隐藏的页面重新可见时也会触发它，比如从详情页返回列表页。所以它适合做“回到页面就刷新数据”这类事情；请求初始数据、读取路由参数这种只做一次的工作，应该放在 <code>onLoad</code>。</p>
<h2>页面栈是什么，最多能有几层</h2>
<p>小程序把按顺序打开的页面存放在一个页面栈里，最底下是第一个打开的页面，最上面是当前显示的页面。<code>getCurrentPages()</code> 返回这个栈，数组第一个元素是首页，最后一个是当前页面。官方文档提醒了两点：不要尝试修改页面栈，会导致路由和页面状态错误；也不要在 <code>App.onLaunch</code> 里调用它，因为那时页面还没生成。</p>
<p>栈的深度有上限。<code>wx.navigateTo</code> 的文档写明，小程序中页面栈最多十层。所以一个可以无限往下点的流程，比如商品详情里不断点“相似商品”，如果一直用 <code>navigateTo</code>，到第十层就打不开了，这种场景要改用 <code>redirectTo</code>，或者在接近上限时换一种跳转方式。</p>
<h2>各种跳转对页面栈做了什么</h2>
<p>“页面路由”文档按路由类型逐个说明了页面栈和生命周期的变化：</p>
<ul>
<li><code>navigateTo</code>：当前栈顶页先被隐藏，触发 <code>onHide</code>；再创建新页面压入栈顶，触发 <code>onLoad</code>、<code>onShow</code>。目标不能是 tabBar 页面，之后可以用 <code>navigateBack</code> 回到原页面。</li>
<li><code>redirectTo</code>：当前栈顶页先被弹出并销毁，触发 <code>onUnload</code>；再创建新页面压入栈顶。目标同样不能是 tabBar 页面。栈的深度不变，所以用户按返回时回不到被替换掉的页面。</li>
<li><code>navigateBack</code>：把栈顶页弹出并销毁，重复 <code>delta</code> 次，至少保留一个页面。栈里只剩一个页面时调用会失败。</li>
<li><code>switchTab</code>：目标必须是 tabBar 页面。框架保证每个 tabBar 页面最多只有一个实例，所以栈里出现 tabBar 页时它一定在栈底。切换时会把栈里多出来的页面逐个销毁，再显示或创建目标 tab 页。</li>
<li><code>reLaunch</code>：页面栈里所有页面从顶到底依次销毁，再创建目标页面作为栈中唯一的页面，目标可以是任意页面，包括 tabBar 页。</li>
</ul>
<p>这里有个容易误解的地方。官方文档特别说明，<code>reLaunch</code> 只是一种路由，不等于小程序重启：JS 运行环境不会重新启动，全局变量和全局状态也不会被重置。所以退出登录后用 <code>reLaunch</code> 回到首页时，存在全局变量里的用户信息要自己清掉。</p>
<h2>常见追问</h2>
<p><strong>从 A 页 navigateTo 到 B 页，再返回 A 页，A 和 B 分别触发哪些生命周期？</strong></p>
<blockquote>
<p>打开 B 时，A 触发 <code>onHide</code>，B 依次触发 <code>onLoad</code>、<code>onShow</code>，渲染完成后触发 <code>onReady</code>。返回时，B 被弹出销毁，触发 <code>onUnload</code>；A 重新可见，触发 <code>onShow</code>，不会再触发 <code>onLoad</code>。</p>
</blockquote>
<p><strong>页面栈满了十层，还想继续打开新页面怎么办？</strong></p>
<blockquote>
<p><code>navigateTo</code> 不能再用了。可以改用 <code>redirectTo</code> 替换当前页，这样栈的深度不变；或者先用 <code>navigateBack</code> 回退几层再打开。设计流程时最好避免一路 <code>navigateTo</code> 叠下去。</p>
</blockquote>
<p><strong>为什么不能用 navigateTo 跳到 tabBar 页面？</strong></p>
<blockquote>
<p>因为官方规定 <code>navigateTo</code> 和 <code>redirectTo</code> 的目标都不能是 tabBar 页，每个 tabBar 页面最多只有一个实例，而且只能在栈底。要切到 tabBar 页，用 <code>switchTab</code>；需要同时清空所有页面时，用 <code>reLaunch</code>。</p>
</blockquote>`};export{e as default};