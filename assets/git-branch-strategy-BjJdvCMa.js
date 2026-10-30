var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>分支策略回答的是“团队里谁在哪条分支上写代码、什么时候合到哪里、从哪里发布”。常见的有三种：Git Flow、GitHub Flow 和主干开发。</p>
<p>Git Flow 来自 Vincent Driessen 2010 年的文章。它有两条长期分支：<code>master</code> 永远是可以上线的代码，<code>develop</code> 汇集下一个版本的开发成果。新功能从 <code>develop</code> 拉 feature 分支，做完合回 <code>develop</code>；准备发版时从 <code>develop</code> 拉 <code>release-*</code> 分支做最后的修补，然后同时合进 <code>master</code> 和 <code>develop</code>；线上出了紧急问题，从 <code>master</code> 拉 <code>hotfix-*</code> 分支，修完也合回两边。</p>
<p>GitHub Flow 简单得多，只有一条默认分支。每项改动开一个短小的分支，提交、推送，开 PR 请同事审查，审查通过就合进默认分支，然后删掉这个分支。主干开发更进一步，所有人都频繁地把改动合进同一条主干，团队大了可以用存在时间很短的功能分支做审查和 CI，但不保留长期的开发分支，没写完的功能用功能开关藏起来。</p>
<p>怎么选看发布方式。Driessen 在 2020 年给原文加了说明：持续交付的 Web 应用建议用 GitHub Flow 这类更简单的流程；只有需要明确的版本号、或要同时维护多个线上版本时，Git Flow 才合适。日常命令里，<code>git switch -c</code> 新建并切换分支，<code>git stash</code> 临时收起没写完的改动，切回来以后再 <code>git stash pop</code>。</p>
</blockquote>
<h2>三种策略怎么比</h2>
<p>Pro Git 把分支分成两类：一直存在、代表不同稳定程度的长期分支，比如 <code>master</code> 和 <code>develop</code>；为一个功能或一个问题临时创建、合并后就删掉的主题分支。三种策略的区别，就在于用了多少长期分支。</p>
<table><thead><tr><th></th><th>Git Flow</th><th>GitHub Flow</th><th>主干开发</th></tr></thead><tbody><tr><td>长期分支</td><td><code>master</code>、<code>develop</code></td><td>只有默认分支</td><td>只有主干</td></tr><tr><td>功能分支</td><td>从 <code>develop</code> 拉，合回 <code>develop</code></td><td>从默认分支拉，PR 后合回</td><td>不用，或者只存在很短时间</td></tr><tr><td>发布方式</td><td><code>release-*</code> 分支合入 <code>master</code> 并打标签</td><td>合入默认分支后部署</td><td>从主干发布</td></tr><tr><td>适合</td><td>有版本号、要维护多个版本</td><td>持续交付的 Web 应用</td><td>频繁集成、配套完善的 CI</td></tr></tbody></table>
<p>为什么 Git Flow 要多一条 <code>develop</code>？因为它假设“开发中的代码”和“已发布的代码”要长期隔离。<code>master</code> 上每一次合并都对应一个发布版本，可以打标签；<code>develop</code> 上则是下个版本正在攒的功能。<code>release</code> 分支让发版前的修补不会挡住 <code>develop</code> 继续接收新功能。</p>
<p>可是对每天都要上线好几次的 Web 应用，这些隔离就成了负担。分支越多、存在越久，合并时冲突越多。GitHub Flow 把流程缩成“开分支、提交、PR、合并、删分支”，GitHub 文档还建议每组不相关的改动单独开一个分支，这样审查容易，出问题也容易单独回退。</p>
<p>主干开发的出发点是减少合并带来的麻烦。trunkbaseddevelopment.com 把它描述为持续集成和持续交付的关键前提：每个人每天多次往主干提交，才能满足“所有改动都及时集成”的要求。代价是主干必须一直保持能构建、能发布，所以要有完善的 CI，以及功能开关这类手段，让没写完的代码合进去也不影响用户，功能开关的设计见<a href="/questions/eng-feature-flags/">《前端功能开关和灰度发布应该怎样设计？》</a>。</p>
<p>Git Flow 合并功能分支时用的是 <code>git merge --no-ff</code>，强制生成一个合并提交，这样从历史里能看出哪些提交属于同一个功能，回退时也能整体撤销。合并和变基怎么选，见<a href="/questions/git-merge-rebase/">《git merge 与 rebase 应该怎样选择？》</a>。</p>
<h2>日常分支命令</h2>
<p>下面是 GitHub Flow 一次完整改动常用的命令：</p>
<div class="not-prose code-block"><div class="code-language">bash</div><pre><code class="hljs language-bash">git switch main
git pull
git switch -c fix-login-timeout   # 新建并切换到分支
git add .
git commit -m &quot;fix: 延长登录超时&quot;
git push -u origin fix-login-timeout
# 在 GitHub 上开 PR，审查通过后合并
git switch main
git pull
git branch -d fix-login-timeout   # 删除已合并的本地分支
</code></pre></div>
<p><code>git switch -c</code> 是新建分支并切换过去，<code>git switch -</code> 切回上一个分支。<code>git branch -d</code> 只会删掉已经合并的分支，没合并的会拒绝，这能防止误删。</p>
<h2>改到一半要切分支，用 git stash</h2>
<p>写到一半，突然要去别的分支修一个问题，可当前改动还不想提交。<code>git stash</code> 能把工作区和暂存区的改动存起来，让工作区回到 <code>HEAD</code> 的状态：</p>
<div class="not-prose code-block"><div class="code-language">bash</div><pre><code class="hljs language-bash">git stash push -m &quot;登录页改到一半&quot;
git switch hotfix-payment
# 修完问题，切回来
git switch -
git stash list    # stash@{0}: On main: 登录页改到一半
git stash pop
</code></pre></div>
<p><code>git stash pop</code> 把最近一次存的改动恢复出来，并从列表里删掉；<code>git stash apply</code> 恢复但保留在列表里，适合要在几个分支上都用一次的情况。<code>stash@{0}</code> 是最新的一条，<code>stash@{1}</code> 是前一条，后面可以加名字指定恢复哪一条。</p>
<p>有一个容易踩的坑：默认情况下，还没被 Git 跟踪的新文件不会被存进去。用 Git 实际试过，新建的 <code>new.txt</code> 在 <code>git stash</code> 之后仍然留在工作区，要加 <code>-u</code>（<code>--include-untracked</code>）才会一起存起来。</p>
<p>另一个坑是冲突。git-stash 文档说明，<code>pop</code> 时如果发生冲突，这条记录不会从列表里删掉，要手动解决冲突，再执行 <code>git stash drop</code>。如果原来的分支改动太多，恢复时冲突严重，可以用 <code>git stash branch 新分支名</code>，它会从当初存的那个提交新建分支再恢复，就不会有冲突。</p>
<h2>常见追问</h2>
<p><strong>Git Flow 里 hotfix 为什么要同时合回 master 和 develop？</strong></p>
<blockquote>
<p>hotfix 是从 <code>master</code> 上线的版本拉出来修的，修完要合回 <code>master</code> 发布。如果不合回 <code>develop</code>，下一个版本从 <code>develop</code> 发布时，这个修复就丢了，同一个问题会再出现一次。release 分支也是同样的道理。</p>
</blockquote>
<p><strong>git stash clear 误删了还能找回来吗？</strong></p>
<blockquote>
<p>有可能，但要尽快。git-stash 文档说明，清掉的记录之后会被垃圾回收清理，到时可能就无法恢复；文档的示例部分给了一种从悬空提交里找回的办法。平时更稳妥的是少用 <code>clear</code>，用 <code>drop</code> 一条条删。找回提交的通用方法见<a href="/questions/git-reflog/">《误删分支或 reset --hard 之后怎样用 reflog 找回提交？》</a>。</p>
</blockquote>
<p><strong>主干开发不开分支，代码审查怎么做？</strong></p>
<blockquote>
<p>主干开发并不禁止分支，只是不要长期存在的分支。trunkbaseddevelopment.com 说明，团队规模和提交频率上来以后，可以用很短的功能分支做代码审查和 CI，检查通过就合进主干；很小的团队可以直接提交到主干。</p>
</blockquote>`};export{e as default};