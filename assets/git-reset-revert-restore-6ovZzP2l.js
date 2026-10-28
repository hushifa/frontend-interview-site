var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>git reset &lt;提交&gt;</code> 把当前分支移到指定提交。<code>--soft</code> 保留暂存区和工作区，<code>--mixed</code>（默认）重置暂存区但保留工作区，<code>--hard</code> 把三者都重置，未提交的修改会丢失。</li>
<li><code>git revert &lt;提交&gt;</code> 生成一个新提交，内容是旧提交的反向修改。原提交仍在历史里，适合已经推送到共享分支的情况。</li>
<li><code>git restore</code> 只处理文件：默认用暂存区恢复工作区，<code>--staged</code> 用 HEAD 恢复暂存区，<code>--source</code> 可以指定从哪个提交取文件。它不移动分支。</li>
<li>reset 改写的是本地分支指针，如果被移走的提交已经推送，再推送需要强制覆盖远端，会影响其他协作者。</li>
</ul>
<h2>三个区域</h2>
<p>Git 的撤销命令围绕三个位置：HEAD 指向的提交、暂存区（index）和工作区。区分命令的关键是它改动了哪几个位置。</p>
<table><thead><tr><th>命令</th><th>移动分支</th><th>暂存区</th><th>工作区</th></tr></thead><tbody><tr><td><code>reset --soft</code></td><td>是</td><td>不变</td><td>不变</td></tr><tr><td><code>reset --mixed</code></td><td>是</td><td>重置</td><td>不变</td></tr><tr><td><code>reset --hard</code></td><td>是</td><td>重置</td><td>重置</td></tr><tr><td><code>revert</code></td><td>新增提交</td><td>写入反向修改</td><td>写入反向修改</td></tr><tr><td><code>restore</code></td><td>否</td><td>仅 <code>--staged</code> 时</td><td>默认</td></tr></tbody></table>
<h2>reset</h2>
<p>在只有本地提交时，reset 适合整理提交：</p>
<div class="not-prose code-block"><div class="code-language">bash</div><pre><code class="hljs language-bash"># 撤销最近一次提交，修改仍在暂存区，可以直接重新提交
git reset --soft HEAD~1

# 撤销最近一次提交和暂存，修改留在工作区
git reset HEAD~1

# 丢弃最近两次提交以及工作区的未提交修改
git reset --hard HEAD~2
</code></pre></div>
<p><code>--hard</code> 丢掉的已提交内容通常还能通过 reflog 找回，做法见<a href="/questions/git-reflog/">《误删分支或 reset --hard 之后怎样用 reflog 找回提交？》</a>。从未提交过的工作区修改不在任何提交里，reflog 也找不回。</p>
<p><code>git reset --keep HEAD~1</code> 也会移动分支并更新工作区，但会保留与这次移动无关的本地修改；如果有本地修改的文件也在被撤销的提交里，它会报错并停止，不会覆盖修改，比 <code>--hard</code> 安全。</p>
<p>reset、merge、rebase 等操作会把移动前的位置记录在 <code>ORIG_HEAD</code>。刚执行完一次 reset 想撤回时，<code>git reset --hard ORIG_HEAD</code> 可以直接回到原位。</p>
<h2>revert</h2>
<div class="not-prose code-block"><div class="code-language">bash</div><pre><code class="hljs language-bash">git revert --no-edit HEAD
</code></pre></div>
<p>执行后历史多出一个 <code>Revert &quot;...&quot;</code> 提交，文件回到被撤销提交之前的内容。撤销合并提交时需要用 <code>-m 1</code> 指定以哪个父提交为主线。revert 不删除历史，所以可以照常推送，也可以再 revert 一次恢复。</p>
<h2>restore</h2>
<p><code>git restore</code> 从 Git 2.23 起提供，用来分担 <code>git checkout</code> 中恢复文件的那部分功能：</p>
<div class="not-prose code-block"><div class="code-language">bash</div><pre><code class="hljs language-bash">git restore src/app.ts            # 放弃工作区修改，回到暂存区的内容
git restore --staged src/app.ts   # 取消暂存，工作区修改保留
git restore --source=HEAD~3 src/app.ts  # 取回三个提交之前的文件内容
</code></pre></div>
<p>被 <code>git restore</code> 覆盖的工作区修改没有提交过，无法恢复。</p>
<h2>常见追问</h2>
<ul>
<li>已经推送的提交能不能 reset？技术上可以，但推送需要 <code>--force-with-lease</code>，其他人基于旧历史的提交会产生分歧。共享分支上用 revert。</li>
<li><code>git reset &lt;文件&gt;</code> 和 <code>git restore --staged &lt;文件&gt;</code> 效果相同吗？都会让该文件的暂存内容回到 HEAD，工作区不变。</li>
<li>线上发布出问题时 revert 就够了吗？源码回滚后还要重新构建和发布，参见<a href="/questions/git-rollback/">《静态网站发布失败时怎样安全回滚？》</a>。</li>
</ul>`};export{e as default};