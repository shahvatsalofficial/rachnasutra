# RachnaSutra AI

UI/UX ઓડિટ અને Agent Skills. CLI કી વગર ચાલે છે. નેટવર્ક કે મોડેલ વગર સોર્સ વાંચે છે. રિપોર્ટ Markdown, HTML, JSON અને SARIF માં આવે છે.

આ પાનું અંગ્રેજી [README](README.md) નો ટૂંકો અનુવાદ છે. સંપૂર્ણ દસ્તાવેજ અંગ્રેજીમાં છે: <https://shahvatsalofficial.github.io/rachnasutra/>

## ઇન્સ્ટોલ

Node.js 20 અથવા નવું.

```bash
npx rachnasutra audit .
```

પ્રોજેક્ટમાં:

```bash
npm install --save-dev rachnasutra
npx rachnasutra audit .
```

રિપોર્ટ `./rachnasutra-reports/` માં `latest.md` અને `latest.html` તરીકે લખાય છે.

## શું ચાલે છે

- સ્ટેટિક ઓડિટ. ફાઇલ અને લાઇન સાથે.
- ઍક્સેસિબિલિટી, રિસ્પોન્સિવ, ડિઝાઇન ટોકન, કન્ટેન્ટ અને ટ્રસ્ટ નિયમો.
- `plan-fixes` અને `verify --report` થી ફિક્સ પ્લાન અને રિગ્રેશન તપાસ.
- 13 Agent Skills. હોસ્ટમાં લોડ થાય છે કે નહીં તે હજુ લાઇવ ચકાસાયું નથી.

## શું ચાલતું નથી

બ્રાઉઝર ઓડિટ Playwright ઇન્સ્ટોલ હોય ત્યારે ચાલે છે: `npx rachnasutra audit --mode browser`. સ્ક્રીનશોટ, axe-core અને Lighthouse લેબ સ્કોર લખાય છે. Playwright ન હોય તો exit 3. બનાવટી પરિણામ નથી.

બનાવનાર [Vatsal Shah](https://github.com/shahvatsalofficial). Apache-2.0.
