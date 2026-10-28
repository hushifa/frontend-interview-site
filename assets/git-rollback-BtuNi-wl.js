var e={answerHtml:`<h2>简答</h2>
<ul>
<li>先止损再排查：最快的回滚方式是把线上切回上一个已验证的构建产物，而不是改代码重新构建。</li>
<li>回滚前判断问题在哪一层：源码、构建产物、托管配置（路由、响应头）还是 CDN 缓存，不同层的回滚方式不同。</li>
<li>源码层面用 <code>git revert</code> 生成反向提交，保留历史；不要在共享分支上用 <code>reset</code> 加强推。</li>
<li>回滚后检查入口 HTML、关键资源和核心流程，并确认 CDN 和浏览器缓存不再提供故障版本。</li>
<li>数据格式或接口已经变化时，单纯回滚前端可能和后端不兼容，要先确认兼容性。</li>
</ul>
<h2>先定位层级</h2>
<table><thead><tr><th>现象</th><th>可能的层级</th><th>回滚方式</th></tr></thead><tbody><tr><td>新功能逻辑错误</td><td>源码</td><td>切回旧产物，随后 revert 提交</td></tr><tr><td>白屏、资源 404</td><td>构建产物或部署过程</td><td>切回旧产物，检查 <code>base</code> / <code>publicPath</code></td></tr><tr><td>深链接 404、缺少响应头</td><td>托管配置</td><td>恢复配置，不需要动代码</td></tr><tr><td>部分用户仍看到旧或坏版本</td><td>CDN / 浏览器缓存</td><td>清除 CDN 缓存，检查缓存头</td></tr></tbody></table>
<h2>切回旧产物</h2>
<p>能快速回滚的前提是每次发布的产物都被保留：</p>
<ul>
<li><strong>托管平台</strong>：Netlify、Vercel、Cloudflare Pages 等保留每次部署，可以在控制台把某次历史部署重新设为生产版本。</li>
<li><strong>发布仓库</strong>（如 GitHub Pages）：在发布仓库中 revert 最近一次发布提交并推送，平台会重新部署上一版文件。</li>
<li><strong>对象存储加 CDN</strong>：资源按版本目录存放时，把入口 HTML 指回上一版目录。</li>
</ul>
<p>这些操作不需要重新安装依赖和构建，几分钟内就能完成。</p>
<h2>修复源码</h2>
<div class="not-prose code-block"><div class="code-language">bash</div><pre><code class="hljs language-bash">git revert &lt;有问题的提交&gt;
git revert -m 1 &lt;合并提交&gt;   # 撤销一次合并，保留主线一侧
git push
</code></pre></div>
<p><code>git revert</code> 新增一个反向提交，别人的本地分支不受影响。之后要重新引入这个功能时，需要 revert 这个 revert 提交，或重新提交修复后的代码。</p>
<h2>回滚后验证</h2>
<ol>
<li>用无缓存的方式请求入口 HTML，确认引用的是旧版本资源文件名。</li>
<li>打开关键页面，检查控制台没有资源加载错误。</li>
<li>走一遍核心流程，例如登录、搜索、提交。</li>
<li>如果入口 HTML 在 CDN 上设置了较长缓存，手动清除对应路径的缓存。</li>
</ol>
<h2>常见追问</h2>
<ul>
<li>为什么不直接 <code>git reset --hard</code> 再强推？它会改写共享历史，别人基于新提交的工作会出错，而且托管平台不一定会因此重新部署。</li>
<li>如何减少回滚需求？发布前在预览环境验证、灰度放量、保留旧资源一段时间，见<a href="/questions/git-static-deploy/">《静态托管发布时为什么要检查资源路径和缓存？》</a>。</li>
</ul>`};export{e as default};