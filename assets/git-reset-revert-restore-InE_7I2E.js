var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>这三个命令都叫“撤销”，但撤的东西不一样。<code>git reset &lt;提交&gt;</code> 是把当前分支挪到指定的提交上。<code>--soft</code> 只挪分支，暂存区和工作区都不动；默认的 <code>--mixed</code> 还会重置暂存区，但保留工作区；<code>--hard</code> 三个都重置，没提交的修改会丢。</p>
<p><code>git revert &lt;提交&gt;</code> 不挪分支，而是新建一个提交，内容正好是旧提交的反向修改。原来的提交还在历史里，所以适合已经推送到共享分支的情况。</p>
<p><code>git restore</code> 只管文件，不移动分支。默认用暂存区的内容恢复工作区，加 <code>--staged</code> 用 HEAD 恢复暂存区，<code>--source</code> 可以指定从哪个提交取文件。</p>
<p>要注意，reset 改的是本地分支指针。如果被挪走的提交已经推送过，再推送就得强制覆盖远端，会影响其他协作者。</p>
</blockquote>
<h2>先分清三个位置</h2>
<p>Git 的撤销都围绕三个位置：HEAD 指向的提交、暂存区（也叫 index，就是 <code>git add</code> 之后放的地方）、工作区（你正在编辑的文件）。分清一个命令改动了哪几个位置，就分清了这几个命令。</p>
<table><thead><tr><th>命令</th><th>移动分支</th><th>暂存区</th><th>工作区</th></tr></thead><tbody><tr><td><code>reset --soft</code></td><td>是</td><td>不变</td><td>不变</td></tr><tr><td><code>reset --mixed</code></td><td>是</td><td>重置</td><td>不变</td></tr><tr><td><code>reset --hard</code></td><td>是</td><td>重置</td><td>重置</td></tr><tr><td><code>revert</code></td><td>新增提交</td><td>写入反向修改</td><td>写入反向修改</td></tr><tr><td><code>restore</code></td><td>否</td><td>仅 <code>--staged</code> 时</td><td>默认</td></tr></tbody></table>
<h2>reset 适合整理本地提交</h2>
<p>提交还只在本地时，reset 很适合用来整理：</p>
<div class="not-prose code-block"><div class="code-language">bash</div><pre><code class="hljs language-bash"># 撤销最近一次提交，修改仍在暂存区，可以直接重新提交
git reset --soft HEAD~1

# 撤销最近一次提交和暂存，修改留在工作区
git reset HEAD~1

# 丢弃最近两次提交以及工作区的未提交修改
git reset --hard HEAD~2
</code></pre></div>
<p><code>--hard</code> 丢掉的已提交内容，通常还能通过 reflog 找回，做法见<a href="/questions/git-reflog/">《误删分支或 reset --hard 之后怎样用 reflog 找回提交？》</a>。可是工作区里从来没提交过的修改，不在任何提交里，reflog 也找不回来。</p>
<p>如果担心 <code>--hard</code> 把本地修改冲掉，可以用 <code>git reset --keep HEAD~1</code>。它同样会移动分支、更新工作区，但会保留和这次移动无关的本地修改；如果某个有本地修改的文件也在被撤销的提交里，它会报错停下，不去覆盖。</p>
<p>还有一个后悔药。reset、merge、rebase 这些操作会把移动之前的位置记在 <code>ORIG_HEAD</code> 里。刚 reset 完就想撤回，<code>git reset --hard ORIG_HEAD</code> 能直接回到原位。</p>
<h2>revert 适合撤销已经推送的提交</h2>
<div class="not-prose code-block"><div class="code-language">bash</div><pre><code class="hljs language-bash">git revert --no-edit HEAD
</code></pre></div>
<p>执行后，历史里多了一个 <code>Revert &quot;...&quot;</code> 提交，文件回到被撤销的那个提交之前的样子。因为它没删任何历史，只是往后加了一个提交，所以可以照常推送；想恢复的话，再 revert 一次这个 revert 提交就行。</p>
<p>撤销合并提交时要加 <code>-m 1</code>，告诉 Git 以哪个父提交为主线。合并提交有两个父提交，不指定的话，Git 不知道“反向修改”该相对哪一边算。</p>
<h2>restore 只管文件</h2>
<p><code>git restore</code> 从 Git 2.23 开始提供，把原来 <code>git checkout</code> 里恢复文件的那部分功能单独拿了出来：</p>
<div class="not-prose code-block"><div class="code-language">bash</div><pre><code class="hljs language-bash">git restore src/app.ts            # 放弃工作区修改，回到暂存区的内容
git restore --staged src/app.ts   # 取消暂存，工作区修改保留
git restore --source=HEAD~3 src/app.ts  # 取回三个提交之前的文件内容
</code></pre></div>
<p>被 <code>git restore</code> 覆盖掉的工作区修改没提交过，是找不回来的，执行前要想清楚。</p>
<h2>常见追问</h2>
<p><strong>已经推送的提交能不能 reset？</strong></p>
<blockquote>
<p>技术上可以，但推送时要用 <code>--force-with-lease</code> 强制覆盖，其他人基于旧历史的提交就会和远端分叉。共享分支上应该用 revert。</p>
</blockquote>
<p><strong><code>git reset &lt;文件&gt;</code> 和 <code>git restore --staged &lt;文件&gt;</code> 效果一样吗？</strong></p>
<blockquote>
<p>一样，都会让这个文件的暂存内容回到 HEAD 的版本，工作区不变。</p>
</blockquote>
<p><strong>线上发布出了问题，revert 就够了吗？</strong></p>
<blockquote>
<p>不够。源码回滚以后还要重新构建和发布，线上才会恢复，参见<a href="/questions/git-rollback/">《静态网站发布失败时怎样安全回滚？》</a>。</p>
</blockquote>`};export{e as default};