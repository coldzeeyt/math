# 🚀 Math Blast

A Kahoot / Blooket-style math game where **every student plays at their own pace**. Everyone's points go to a shared **class goal**, and a live leaderboard runs on the teacher's screen.

## Modes

| Mode | What happens |
| --- | --- |
| **🎮 Play Solo** | Choose a grade, topics and a time limit (or ∞ Zen), then try to beat your personal best. Your best runs are saved on your device. |
| **📺 Host a Game** | The teacher picks a grade, topics, time limit and class goal, then puts the lobby on the projector. It shows a 6-digit PIN, students join, and the teacher presses Start. During the game the host screen shows the class rocket, the live leaderboard and an activity feed. When time is up there's a podium reveal, and results can be downloaded as a CSV. |
| **🙋 Join a Game** | Students enter the PIN, pick a nickname and an avatar, and type their answers at their own speed. They can see their score, their streak, their rank and the class goal as they play. |

## What makes it fun

- **Type your answer, MathJam-style.** Students type answers with an on-screen number pad or a keyboard, then press ✓ or Enter. Units such as `$`, `¢`, `cm`, `%`, `π` and `x =` are already shown around the box. Equivalent answers are accepted, so 1/2, 2/4 and 0.5 all count.
- **Skip, but everyone sees it.** Stuck students can press Skip. It costs their streak, and the host screen shows a big yellow **"NAME SKIPPED A QUESTION!!"** in the feed. The results table and CSV include a Skipped column.

- **Streaks & speed bonus.** 100 points per correct answer, plus up to +100 for a streak and up to +50 for answering quickly.
- **Treasure chests.** Every 5 correct in a row opens a chest: Gold Pile, Double Power (2× for 3 answers), Gem Bonus (+10%) or JACKPOT.
- **Class rocket.** Every point any student earns fuels a rocket toward the class goal.
- **Sounds, confetti and animations.** Sound can be muted with the 🔊 button.
- **Mini-lessons.** A wrong answer shows the correct answer and a hint, e.g. "💡 a² + b² = c²".

## Visual math, K–8

Questions come with pictures:

| Grade | Topics |
| --- | --- |
| K | Counting emoji, adding with pictures, take away, ten frames, shapes, comparing on a number line |
| 1 | Ten frames, tens & ones blocks, clocks, bar graphs, balance-scale missing numbers |
| 2 | Base-ten blocks to 1000, clocks to 5 minutes, coins, arrays |
| 3 | Multiplication arrays, division groups, pizza fractions, area grids, perimeter, rounding |
| 4 | Fraction bars, angle types, factors, multi-digit × and ÷ |
| 5 | 3D cube volume, coordinate plane, decimals, adding fractions, order of operations |
| 6 | Ratio tiles, percent grids, negative number lines, exponents, equations, triangle area |
| 7 | Integers, probability spinners, circles, unit rates, discounts, two-step equations |
| 8 | Slope from a graph, Pythagorean triangles, function machines, exponent rules, roots, scientific notation |

About 1 in 6 questions reviews the grade below, as a confidence-builder. This only happens when all topics are selected.

## Run it

You need Node.js 18 or newer. There are **no dependencies to install**.

```bash
npm start          # http://localhost:3000  (set PORT to change)
npm test           # checks every question generator + scoring rules
```

Students on the same network join at `http://<teacher-computer-ip>:3000/play.html`. You can also deploy it to any Node host (Railway, Render, Fly.io, etc.). It's a single process.

## How it works

- `server.js` is a plain Node HTTP server. Live rooms are stored in memory. Students send each answer's result with a POST, and the server scores it and pushes room updates to everyone over Server-Sent Events. Rooms are cleaned up after 4 idle hours.
- `public/js/questions.js` has the question generators by grade and topic.
- `public/js/visuals.js` has the SVG builders for the pictures.
- `public/js/answers.js` checks typed answers and picks which keys the keypad shows.
- `public/js/scoring.js` holds the scoring rules. The server and solo mode both use it.
- `public/js/quiz.js` is the self-paced question loop: the answer box, keypad, skip and treasure chests.
- `public/*.html` are the pages: home, solo, play (student) and host.

Note: rooms live in memory, so restarting the server ends any games in progress. Run a single instance.
