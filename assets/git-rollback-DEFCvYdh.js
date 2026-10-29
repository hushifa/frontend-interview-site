var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>线上出问题，第一件事是止损。最快的办法是把线上切回上一个验证过的构建产物，而不是改代码再重新构建一遍。</p>
<p>回滚之前要先判断问题出在哪一层：源码、构建产物、托管配置（比如路由规则、响应头），还是 CDN 缓存。层不同，回滚的方式也不同。</p>
<p>源码层面用 <code>git revert</code> 生成一个反向提交，历史保留下来；共享分支上不要用 <code>reset</code> 加强制推送。还要记住，撤销了 Git 提交，线上不会自己恢复，要重新构建发布才行。</p>
<p>回滚后要检查入口 HTML、关键资源和核心流程，确认 CDN 和浏览器缓存不再给出故障版本。另外，如果数据格式或接口已经变了，单独回滚前端可能和后端对不上，要先确认兼容。</p>
</blockquote>
<h2>先判断问题出在哪一层</h2>
<table><thead><tr><th>现象</th><th>可能的层级</th><th>回滚方式</th></tr></thead><tbody><tr><td>新功能逻辑错误</td><td>源码</td><td>切回旧产物，随后 revert 提交</td></tr><tr><td>白屏、资源 404</td><td>构建产物或部署过程</td><td>切回旧产物，检查 <code>base</code> / <code>publicPath</code></td></tr><tr><td>深链接 404、缺少响应头</td><td>托管配置</td><td>恢复配置，不需要动代码</td></tr><tr><td>部分用户仍看到旧或坏版本</td><td>CDN / 浏览器缓存</td><td>清除 CDN 缓存，检查缓存头</td></tr></tbody></table>
<p>为什么要先分层？比如深链接 404 是托管平台的重写规则丢了，这时候去 revert 代码、重新构建，忙了半天问题还在。先看现象落在哪一层，才能用对办法。</p>
<h2>怎样快速切回旧产物</h2>
<p>能快速回滚的前提，是每次发布的产物都留着。不同的托管方式做法不同。</p>
<p>Netlify、Vercel、Cloudflare Pages 这类托管平台会保留每次部署，在控制台里把某次历史部署重新设成生产版本就行。</p>
<p>用发布仓库的，比如 GitHub Pages，在发布仓库里 revert 最近一次发布提交并推送，平台会重新部署上一版的文件。</p>
<p>用对象存储加 CDN 的，如果资源按版本目录存放，把入口 HTML 指回上一版的目录。</p>
<p>这些操作都不用重新安装依赖、重新构建，几分钟内就能完成。</p>
<h2>源码怎样回滚</h2>
<p>线上止住以后，再处理源码：</p>
<div class="not-prose code-block"><div class="code-language">bash</div><pre><code class="hljs language-bash">git revert &lt;有问题的提交&gt;
git revert -m 1 &lt;合并提交&gt;   # 撤销一次合并，保留主线一侧
git push
</code></pre></div>
<p><code>git revert</code> 是往后新加一个反向提交，别人的本地分支不受影响。之后想把这个功能重新加回来时要注意：直接再合并一次原来的分支是没用的，因为 Git 认为那些提交已经合过了。要么 revert 掉这个 revert 提交，要么重新提交修好的代码。</p>
<h2>回滚以后检查什么</h2>
<ol>
<li>用不带缓存的方式请求入口 HTML，确认它引用的是旧版本的资源文件名。</li>
<li>打开关键页面，看控制台有没有资源加载错误。</li>
<li>把核心流程走一遍，比如登录、搜索、提交。</li>
<li>如果入口 HTML 在 CDN 上设置了较长的缓存，手动清除对应路径的缓存。</li>
</ol>
<h2>常见追问</h2>
<p><strong>为什么不直接 <code>git reset --hard</code> 再强制推送？</strong></p>
<blockquote>
<p>它会改写共享历史，别人基于那些提交做的工作会出错。而且托管平台不一定会因为强制推送就重新部署。</p>
</blockquote>
<p><strong>怎样减少回滚的需要？</strong></p>
<blockquote>
<p>发布前在预览环境验证，用灰度逐步放量，旧资源保留一段时间，见<a href="/questions/git-static-deploy/">《静态托管发布时为什么要检查资源路径和缓存？》</a>。</p>
</blockquote>`};export{e as default};