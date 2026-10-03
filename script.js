if (window.pdfjsLib) pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ---------------- data ---------------- */
const members = [
  {id:'ji',  name:'지우', c:'var(--m1)', role:'팀장'},
  {id:'seo', name:'서연', c:'var(--m2)', role:'팀원'},
  {id:'ha',  name:'하린', c:'var(--m3)', role:'팀원'},
  {id:'do',  name:'도윤', c:'var(--m4)', role:'팀원'}
];
const mem = id => members.find(m => m.id === id);

/* peer evaluation is its own feature now: professor authors the questions (5-point
   scale, fixed labels), students answer per teammate, and both sides read/write the
   same peerQuestions / peerAnswers so edits on one side show up on the other. */
const peerScaleLabels = ['매우 부족','부족','보통','우수','매우 우수'];

let peerQuestions = [
  {id:'q1', text:'참여도'},
  {id:'q2', text:'기한 준수'},
  {id:'q3', text:'소통 태도'}
];

/* peerAnswers[evaluatorId][targetId] = {scores:{questionId:1~5}, note} */
let peerAnswers = {
  ji:  { seo:{scores:{q1:2,q2:3,q3:2}, note:'회의 때 말이 별로 없어서 뭘 하는지 잘 모르겠어요.'},
         ha: {scores:{q1:5,q2:4,q3:5}, note:''},
         do: {scores:{q1:4,q2:4,q3:5}, note:'항상 밝고 긍정적이에요!'} },
  seo: { ji:{scores:{q1:5,q2:5,q3:4}, note:'항상 회의를 잘 이끌어요.'},
         ha:{scores:{q1:4,q2:4,q3:4}, note:''},
         do:{scores:{q1:4,q2:3,q3:4}, note:''} },
  ha:  { ji:{scores:{q1:4,q2:4,q3:4}, note:'책임감이 느껴져요.'},
         seo:{scores:{q1:2,q2:2,q3:3}, note:''},
         do:{scores:{q1:4,q2:4,q3:4}, note:'꼼꼼하게 첨삭해줘요.'} },
  do:  { ji:{scores:{q1:5,q2:4,q3:4}, note:''},
         seo:{scores:{q1:3,q2:2,q3:2}, note:'진행 상황 공유가 부족해요.'},
         ha:{scores:{q1:4,q2:4,q3:4}, note:'조금 더 적극적이면 좋겠어요.'} }
};
let peerSubmitted = {ji:true, seo:true, ha:true, do:true}; // which evaluators have submitted

function peerQuestionAvg(targetId, qid){
  const vals = members.filter(m => m.id !== targetId)
    .map(m => peerAnswers[m.id] && peerAnswers[m.id][targetId] ? peerAnswers[m.id][targetId].scores[qid] : null)
    .filter(v => v != null);
  return vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : null;
}
function peerOverallAvg(targetId){
  const qAvgs = peerQuestions.map(q => peerQuestionAvg(targetId, q.id)).filter(v => v != null);
  return qAvgs.length ? qAvgs.reduce((a,b)=>a+b,0)/qAvgs.length : 0;
}

/* 각자 제출해야 할 문서 개수는 역할마다 달라요 */
const docQuota = {ji:2, seo:2, ha:3, do:1};

let tasks = [
  {id:'t1', who:'ha',  title:'5장 결론 작성',   date:'9/24', dday:'D-3', overdue:false, done:false},
  {id:'t2', who:'do',  title:'발표 대본 초안',   date:'9/20', dday:null,  overdue:true,  done:false},
  {id:'t3', who:'ji',  title:'최종 PPT 취합',    date:'9/27', dday:'D-6', overdue:false, done:false},
  {id:'t4', who:'ji',  title:'최종본 제출',      date:'9/29', dday:'D-8', overdue:false, done:false},
  {id:'t5', who:'seo', title:'경쟁사 분석 정리', date:'9/20', dday:null,  overdue:false, done:true},
  {id:'t6', who:'ha',  title:'설문 결과 정리',   date:'9/21', dday:null,  overdue:false, done:true}
];

let docs = [
  {id:'du0', who:'ha', name:'치팅시트_투자론_기말.docx', meta:'방금 업로드 · 0.5MB', comments:[], viewable:true, real:true,
    rich:true, paragraphs:[
    "<p><strong>7장: </strong>이표채: 이자지급일에 이자 o, 무이표채: 채권의 액면금액을 할인한 금액으로 발행하는 채권으로 만기에 액면금액 상환 (할인채), 복리채: 이자지급기간동안 지급이자가 복리로 재투자되어 만기상환시 원금과 이자 동시에 지급 </p>",
    "<p>①담보부채권: 부동산, 설비, 자산 등을 담보로 제공, 기업이 부도 시 담보자산 통해 회수 가능 → 신용위험 낮음 ②무담보채권: 담보 없음, 발행기업의 신용도에만 의존 → 위험 높고, 대신 수익률 높음 ③수익사채: 기업이 이익이 발생한 경우에만 이자 지급, 기업 입장: 부담 적음 투자자 입장: 위험 큼 ④감채기금조항: 회사가 매년 일정 금액을 적립해 원금 상환 재원을 미리 마련→투자자 보호 장치→위험↓=수익률↓ ⑤ 자산유동화증권: 기업이 보유한 자산(매출채권, 할부채권)을 묶어 발행, 자산으로 상환 보증 ⑥모기지채권: 주택담보대출(모기지)을 묶어 증권화, 주택대출 상환금이 현금흐름의 원천 // ① 수의상환채권: 발행자가 조기상환(Call)할 수 있는 권리, 금리가 떨어지면 발행기업이 상환해버림(재발행해서 이자절감)→ 투자자 입장: 불리→ 가격↓/수익률↑ ② 상환요구권부사채 투자자가 발행자에게 조기상환을 요구할 수 있는 권리, 금리가 오르면 투자자는 채권 가치 하락을 피하려고 put 행사 → 투자자 입장: 유리 → 가격↑ / 수익률↓ ③ 전환사채 일정 조건에 따라 주식으로 전환할 수 있는 채권. 기업 성장 기대 시 채권 가격 상승 → 옵션 가치 때문에 보통회사채보다 가격↑④ 신주인수권부사채: 채권 + 신주인수권(주식을 살 수 있는 권리) ⑤ 교환사채: 발행자 회사 주식이 아니라 다른 회사 주식으로 교환 가능</p>",
    "<p>무이표채의 가격 = , 이표채의 가격  🡪 C 이표. </p>",
    "<p><strong>만기수익률(YTM):</strong> (1) 채권을 만기까지 보유한다 (2) 만기까지 얻는 모든 현금흐름을 만기수익률로 재투자한다.   </p>",
    "<p><strong>1. 이자율 위험</strong> (만기 길 수록, 액면이자율 낮을수록) <strong>2. 재투자위험</strong>: 중간에 받은 쿠폰을 ‘원래 기대했던 YTM으로 다시 투자하지 못할 위험’, ① 만기가 길수록 → 위험 증가 (재투자할 쿠폰이 많아지니까 금리가 변할 “횟수”가 많아짐) ② 이표율이 높을수록 → 위험 증가 (재투자수익에 대한 의존도 및 재투자위험 증가. 쿠폰이 크다는 것은 재투자해야 하는 돈이 많다는 뜻 → 금리 변화의 영향이 훨씬 커짐) 3. 신용위험: 투자 등급: BBB 이상, 투기등급: BB이하, 고수익채권</p>",
    "<p><strong>채권수익률의 기간구조</strong>: 우상향🡪장기채 수익이 단기차보다 높음. 정상. 우하향🡪단기수익률&gt;장기, 언덕형: 시중 단기 자금사정 어려움, 수평형: 미래 이자율에 눈에 띄는 채권x.</p>",
    "<p>현물이자율=연간이자율: 현재의 이자율로 현재시점에서 미래의 일정시점까지의 매 기간별 무이표채의 만기이자율. / 선도이자율: 1년, 3년후 등 미래시점에서 시장에서 형성되는 단기금리로 장기와 단기투자를 같게 하기 위해 요구되는 수익률  // -1 </p>",
    "<p>기대이론: 미래 단기금리의 기대, 유동성선호이론: 장기채에 유동성 프리미엄 요구, 시장분할이론: 기간별 수요·공급, 선호영역이론: 기대 + 유동성 + 시장분할 절충</p>",
    "<p><strong>8장</strong>: 1. 채권 가격 ⬄ 채권 수익률(이자율): 역의 관계 2. 장기 채권일 수록 이자율 위험 큼 3. 채권 가격의 변동은 만기가 길어질 수록 체감하면서 증가 4. 시장 이자율 하락으로 인한 채권가격 상승분은 시장 이자율 상승으로 인한 채권가격 하락분보다 크기가 더 큼 (=변화정도 비대칭적) 5. 같은 만기이더라도 이표율(액면이자율)이 낮은 채권일 수록 이자율 변동에 빠른 채권 가격 변동이 더 큼 </p>",
    "<p>듀레이션 계산식:  / n: 만기까지 기간의 수, t: 현금흐름 발생한 기간, CFt: t기간의 현금흐름, i: 만기수익률 / 듀레이션 특징: 1. 이표채권 듀레이션 &lt; 만기 2. 액면이자율(이표율)⬄듀레이션: 역의 관계3. 만기 길어지면 듀레이션 ↑, 그러나 체감하면서 증가. 이표율 낮으면 만기 길어질 수록 듀레이션 ↓4. 만기수익률⬄ 듀레이션: 역의 관계 5. YTM(시장금리) 높을수록 듀레이션 짧</p>",
    "<p>수정 듀레이션 : 채권에 대한 이자율 민감도를 측정하기 위해 조정된 듀레이션 🡨 맥컬리 듀레이션/(1+i/n) 채권 가격의 변동은 수정 듀레이션에 비례하여서 변동</p>",
    "<p>1. 듀레이션을 이용한 채권가격 변화금액 (1) 채권가격 변화율  (2) 채권가격 변화금액  2. 볼록성에 의한 채권가격 변화금액 (1) 채권가격 변화율 <em> </em>(2) 채권가격 변화금액 </p>",
    "<p><strong>볼록성</strong>: 채권의 가격은 볼록한 곡선의 함수의 관계 가지고 있음 (채권수익률 하락할 경우 채권가격 상승분을 과소평가, 상승할 경우 하락분을 과대평가) <strong>/ 채권가격 변화율</strong>: -수정듀레이션*이자율변화+1/2*볼록성*이자율변화제곱</p>",
    "<p><strong>소극적 채권투자전략</strong>: (1)매입 보유 전략: 채권 매입해서 만기까지 보유 (2)채권 인덱스 전략: 목표지수에 연동된 수익률과 위험 추적하여 정해진 채권지수 모방 (규모 커야됨, 주기적 조정 필요 (3)면역전략: 이자율의 변화로부터 포트폴리오 면역화, 이자율 변화에 관계 없이 일정기간동안 정해진 수익률 얻을 수 있도록 투자하는 전략 🡪 목표기간 면역화 (채권 듀레이션과 투자기간 매치) / 순자산 면역화 (부채와 자산 듀레이션 일치) 고려사항: 포폴 주기적으로 자주 조정 (이자율 병동시, 시간 경과하면 듀레이션이 만기보다 빨리 감소), 거래비용 발생 <strong>적극적 채권투자전략</strong>: (1)목표투자기간 분석: 수익선 곡률 이용하여 투자 기간 말의 미래 이자율 예측하여 높은 수익률 올리려는 방법 🡨 자본이득 – 시간효과 + 이자율 변화효과 (2) 채권의 수익금액=시간효과+이자율 변화효과+액면이자+이표채투자 (3)채권스왑: 현재 포트폴리오 포지션 청산하고 그와 유사한 특성을 가지지만 더 나은 수익률 낼 것으로 예상되는 채권 매입 (4)상황별 면역전략: 적극적 투자를 소극적 투자로 바꾸어 종료시점에 목표의 자산가치를 확보하려는 전략 (5)수익률 곡선타기: 단기채권을 대상으로 우상향하는 수익률곡선에서 채권의 잔존기간이 짧아지면서 발생하는 수익률 하락으로 인한 채권매매이익을 얻으려는 전략</p>",
    "<p><strong>9장 투자 목표</strong>: 소득창출 및 자본유지(저위험-저수익), 자본증식(고위험, 투기적), 세금절감(세금면제 증권), 위험관리(위험수익 상충관계 고려, 포트폴리오 최상위 수준에서 관리) / 투자 제약: 유동성, 투자 목표기간, 세금 (세금우대, 비과세 투자 유리) / 투자 전략 (1) 소극적: 효율적 시장가설에 기초, 장기 유지, 예측 최소화 but 자금 요구 많 (2) 적극적: 저평가 매입, 고평가 매도, 고위험-고수익 투자 </p>",
    "<p><strong>자산배분</strong>: 증권들을 기대수익-위험 특성에 의해 자산집단(채권/부동산 등 큼)으로 구분, 자금배분 / 고정가중치 자산배분: 집단별로 고정된 비중에 기초하여 투자. 가중치 변화x, 포트폴리오 재조정 필요 0 </p>",
    "<p>뮤추얼펀드: 소액투자자 자금 모아서 분산투자 및 전문운용, NAV 기준 거래 (1)개방형:환, 자유로운 인출O but 환매는 신청일의 종가를 기준으로 실행되므로 일정기간을 기다린 후에 자금을 회수할 수 있음 / NAV 기준 / 주식수 변함 (2)폐쇄형: 고정발행 -&gt;신규투자X, 언제든지 주식 매도 자금회수 가능/ 시장가 거래 /프리미엄·디스카운트</p>",
    "<p><strong>ETF(상장지수 펀드</strong>):증권거래소에 상장되어 거래. ETF는 폐쇄형 펀드와 개방형 펀드의 장점 결합. 시장 거치지 않고 사고팔 수 있고, 개방형 펀드에 수반되는 환매절차 거치지 않고 자금 회수 가능. 발행주식수 변화 가능. 증권거래세 부과 X. 미국 1995, 국내 2002년.</p>",
    "<p>상장지수증권(ETN): 증권회사가 발행한 파생결합증권, 거래소에 상장되어 거래, 원금비보장형 간접투자방식 상품, 실시간 환금성 O, 추적오차 발생하지 X, 실물자산 소유하지 않으므로 신용위험 X. </p>",
    "<p>부동산투자회사(리츠): 부동산 매입, 수익과 매각으로 발생한 이익 90% 배당, 세제혜택, 유동성 굿</p>",
    "<p><strong>10장 </strong>보유기간 수익률(HPR):  (기말가격-기초가격_현금소득기초가격)</p>",
    "<p>시간가중수익률(TWR) (1) 기하평균수익률: -1 (2) 산술평균수익률: )/n * 기하평균 VS 산술평균: 기하가 산술보다 작거나 같음 (=보수적으로 평가), 산술은 과거 실적 기초로 미래 수익률 예측, 산술은 매기간 말에 잔고 조정하여 항상 동일한 금액으로부터 새로운 투자기간 개시하는 방법에 적함, 기하는 과거 실적 투자자에게 제시+기말에 투자의 순수익을 인출하는 경우 적합</p>",
    "<p>금액가중수익률(DWR): 수입과 지출 모두 고려하여 투자의 순현재 가치를 0으로 만드는 할인율 </p>",
    "<p><strong>샤프비율</strong>: 포트폴리오의 위험조정 성과척도로서, 초과수익률의 표준편차에 대한 비율을 성과 지표로 제안. 대규모 포트폴리오의 투자성과 평가에 적합.   / <strong>트레이너 비율</strong>: TR이 높으면 포트폴리오는 체계적 위험에 비해 높은 수익률 올림. 체계적 위험만을 고려해도 무방한 상황에 적합. / 젠센알파:  포트폴리오의 실현된 수익률이 CAPM에 기초한 기대수익률을 초과하는 값인 비정상수익률, 양수일 경우 포트폴리오 수익률은 체계적 위험을 보상하는 수준보다 높음을 의미. 음수이면 투자성과 미흡 / <strong>정보비율</strong>: 젠센알파의 비체계적 위험에 대한 비율    🡪 잔차의 표준편차는 비체계적 위험으로 간주 / 얼마나 더 추가적 수익률을 얻었는지 나타냄, 헤지펀드의 증권선택 능력을 평가하는 데에 적합.</p>",
    "<p><strong>시장타이밍</strong>: 시점선택 or 전술적 자산배분. (e.g., 경기 상승 예상시 베타계수 높은 자산 매수) 주가 오르면 채권가격 하락, 내리면 상승. </p>",
    "<p>완벽한 시장타이밍의 포트폴리오 수익률 </p>",
    "<p><strong>스타일분석</strong>: 포트폴리오의 성과를 다양한 스타일의 벤치마크 포트폴리오에 비교하여 평가. / 위험조정등급평가: </p>",
    "<p><strong>전략적 자산배분</strong>: 투자 목적, 금액 등 고려해여 장기적으로 유지되는 포트폴리오의 구성비중을 의미. 일시적 가격 오류 이용 X, 수익률=전략적 투자비중에 벤치마크 수익률 곱//<strong>전술적 자산배분</strong>: 중, 단기적으로 시장상황에 따라 비교적 작은 폭으로 포트폴리오 구성을 변화시키는 행위. 고평가/저평가된 자산 집단 판단하여 투자에 반영함. // 실제 포트폴리오 수익률 = </p>",
    "<p><strong>11장  1. 위험 종류</strong> (1)시장위험 (2)신용위험: 채무불이행 + 결제 불이행 (3)유동성위험 (4)운영위험 <strong>2. 위험 척도</strong>: 1. 표준편차(전체 변동성) 2. 하방표준편차(손실만 반영) 3. <strong>VaR</strong> 정의: 신뢰수준 α 하에서 목표기간 동안 발생할 수 있는 최대손실금액 (e.g. 99% VaR=100억 → 손실이 100억 이하일 확률 99%, 초과 1%./신뢰수준 선택:방어·규제 목적=99%, 일반=95%, 위험회피 유인이 강할 때는 더 높은 신뢰수준🡪더 높은 Var 🡪 더 많은 목표 자기자본) *Risk Metric은 95%,1일/바젤은 99%,10일.  </p>",
    "<p>위기상황분석: 극단적 손실 시나리오 분석 (단순민감도:개별적 위험요인, 시나리오분석:특정시나리오, 역위기상황분석:분석 범위의 한계를 보완) // 사후검증: 잘 반영하고 있는지 사후적 확인.</p>",
    "<p>Var 추정접근법: 포지션의 변동성을 이용하여 위험 측정, </p>",
    "<p><strong>1) 위험요인 선택</strong>: 주가·금리·환율·스프레드 등. 선택 잘못하면 VaR 왜곡. <strong>2) 위험요인 변화</strong> 추정: (1) 모수적: 분포(정규 등) 가정, μ·σ로 추정, 계산 빠름(델타-노멀). 단점: fat-tail 과소평가 (2) 비모수적: 분포 가정 없음, 과거 데이터 그대로 적용. 단점: 과거=미래 전제 (3) 혼합적: 모수+비모수 절충, 변동성 조정 후 시뮬레이션. <strong>3) 매핑(Mapping</strong>): 위험요인→가치 연결 (주식: β / 채권: 듀레이션 / 옵션: 감마·볼록성)</p>",
    "<p><strong>4) 평가방법</strong>: (1) 부분평가: 선형 근사 + 정규분포 가정 → 빠르나 비선형 상품 부정확</p>",
    "<p>(2) 완전평가: 포트폴리오 직접 재평가(역사적·몬테카를로), 비선형 반영↑, 계산량↑</p>",
    "<p><strong>(1) VaR 활용</strong>: 위험을 한 숫자로 표현(보고 용이), 위험한도 설정, 자원배분(RAROC:이익/VaR), 바젤 규제, 공통 위험척도. <strong>(2) VaR 한계</strong>: tail risk·fat-tail(손실확률 과소추정), 과거 데이터 의존(위기 시 붕괴), 시나리오·모형의 주관성, 추정에 따라 변동 큼, 사후검증 필요.</p>",
    "<p><strong>신용위험</strong>: 거래상대방 부도·불이행 위험. / 요소: 부도위험, 부도시 손실률, 신용노출액 / 기대손실(ECL) vs 비기대손실(UL=VaR로 측정). 특징: 분포 왼꼬리·비대칭, 기간은 장기, 법적요소 중요. / 신용사건 처리: 재건형(자율협약·워크아웃·회생) or 청산형(파산·우선순위 배분) / 관리: 부도위험(채무자 신용등급 고려), 신용노출 조절(노출 포지션 한도 설정-&gt;분산투자)</p>",
    "<p><strong>유동성위험</strong>: 제때 현금 확보 못해 채무이행 실패 or 급매 손실 / 지표: 자금갭(funding gap = 유입–유출), 생존기간(survival period) / CaR(CF at risk): 순지출의 VaR/ 관리: 자산유동성(한도설정, 위험분산)·조달유동성(안정적 자금조달 원천 의존, 부채만기 분산 포함) 분산, 차환위험 관리, 위기자금조달계획 필요.</p>",
    "<p><strong>12장</strong> 1. <strong>파생상품 개요·기능</strong>: 기초자산·지수 가격에서 가치가 파생되는 계약상품.</p>",
    "<p>기능: 헤지(위험회피) / 투기, 고수익 / 차익거래 / 가격발견 / 리스크 분산 + 특징: 레버리지 큼(원금초과 손실 가능), 시장·신용·유동성·운영위험 존재.</p>",
    "<p><strong>2. 종류·시장구조</strong> 🡪 기초자산별: 실물(원자재) / 금융(주식, 채권, 금리, 환율, 지수). 계약형태: <strong>선도</strong>:계약 오늘 체결, 미래 시점에 이루어짐, 신용위험↑, <strong>선물</strong>: 거래소, 표준화, 안전장치:증거금+청산소+일일정산, <strong>옵션</strong>: 콜·풋, 권리와 의무 분리, <strong>스왑</strong>: 금리·통화 등 미래 현금흐름 교환. 시장: 장내(선물 옵션, 불특정 다수 이용, 신용위험 제거 장치o, 상품 구조 표준화), 장외(선도, 스왑, 옵션, 금융기관, 거래상대방신용위험, 다양한 구조 상품 구성 가능)</p>",
    "<p><strong>3. 선도·선물</strong> 🡪 롱: 계약 매수, 계약 가격 상승 원함 / 숏: 계약 매도, 계약 가격 하락 원함 // 선물 특징: 거래소, 표준화, 증거금 제도 + 일일정산, 상쇄 거래에 의해 매수 매도 포지션 청산 가능/ 만기결제: 실물인도 or 현금결제(지수선물·옵션 = 현금결제) / 옵션(권리 행사 선택 가능) vs 선물·선도(의무 만기 이행 필요)</p>",
    "<p><strong>4. 옵션</strong>: 콜(Call): 기초 자산 행사가격에 매수할 권리, 풋(Put): 매도할 권리 // 매수자: 프리미엄 지급, 증거금 의무 없음, 최대손실 = 프리미엄, 매도자(Writer): 프리미엄 수취, 손실 잠재적으로 매우 큼 / 가격상태: ITM(내가격 🡪 profitable, 콜: 시장가격&gt;행사), OTM(외가격🡪 Not ptofitable, 콜: 시장가격&lt;행사), ATM(등가격, 행사 하나 안하나 동일).(1)미국식: 만기 전 언제나 행사 가능 → 가치 ≥ 유럽식 (2) 유럽식: 만기일에만 행사 (한국=유럽식) <strong>옵션 가격 결정 모형</strong>(콜 기준)↑: 가격(S), 변동성(σ), 만기(T), 무위험이자율(r) vs ↓: 행사가격(K), 배당수익률(d). // <strong>옵션 거래 전략</strong> <strong>1. 투기목적의 매수</strong> (보통주에 투자하는 것과 유사, 레버리지 이용 가능하여 많은 자본 필요 x, 옵션 비용 이상의 손실 입지 않음) <strong>2. 위험 완화를 위한 헤지</strong> (목적은 위험 감소, 2개 이상 증권 합쳐서 하나의 투자 포지션 만듦. (1)매수(롱)포지션 헤지 🡪 풋옵션 매수, 같은 기업 주식 보유. 풋옵션 매수가 주식을 매도하기 전에 주식 가격이 하락하는 경우에 보험 제공, (2) 매도(SHOrt)포지션 헤지: 주식을 공매도하고 콜옵션 매수, 콜옵션은 만일 주식 가격이 하락하지 않고 상승할 경우 공매도 해소하기 위해 주식을 매수할 수 있도록 함<strong>.)  3. 수익률 향상을 위한 옵션 매도 </strong>(옵션 매도자는 주가 방향에 대해 매수자가 잘못 판단했다는 쪽으로 예상, 옵션 무효되면 이득, 매도자는 발행가 이상으로 이익 낼 수 X, 옵션이 내가격이라면 위험 큼. Naked option: 자신이 소유하지 않은 주식에 대한 옵션 발행, 손실에 대한 노출은 제한 X, Covered: 소유하고 있거나 반대 포지션 주식에 대해 옵션 발행, 손실 노출은 증권 매수에 지불된 가격으로 제한)  <strong>4. 수익률 향상을 위한 옵션 스프레딩</strong> (프리미엄 차이 이용하여 이익 목적, 한번 거래에 2개 이상 옵션 조합. 수직형: 콜옵션 매수하면서 더 높은 행사가격에 다른 콜옵션 매도, 옵션 스트레들: 같은 기초자산에 대한 풋콜 동시에 매수) </p>",
    "<p>(1) Bull Spread(불 스프레드): 낮은 행사가 콜 매수 + 높은 행사가 콜 매도(K₁&lt;K₂).</p>",
    "<p>→ 상승장 베팅, 이익·손실 모두 제한(상승 시 이익 but 상한에서 제한, 하락시 손실 제한) // (2) Bear Spread(베어 스프레드): 높은 행사가 풋 매수 + 낮은 행사가 풋 매도(K₂&gt;K₁) → 하락장 베팅, 이익·손실 모두 제한(하락 시 \") // (3) Butterfly Spread(버터플라이): 낮은 K 콜 매수 + 중간 K 콜 2개 매도 + 높은 K 콜 매수(등간격) → 저변동성 베팅, 가격이 중간 행사가(K₂) 근처일 때 최대이익, 손실 제한. (상하한 존재)</p>",
    "<p><strong>5. 스왑</strong> (금리·통화) 🡪 (1) 금리스왑 (Plain Vanilla): 고정금리 ↔ 변동금리(Libor 등) 상호 교환. 목적: 금리위험 헤지, 상대적 금리우위 활용해 조달비용 절감. 정산은 보통 순액으로. &lt;순이자=(받는금리 − 내는금리) × 원금 × (기간/1년)&gt; (2)통화스왑: 서로 다른 통화의 원금 + 이자 교환 / 환위험 + 금리위험 동시에 관리.</p>",
    "<p><strong>6. 위험 유형</strong> 🡪 시장위험: 기초자산 가격변동 / <strong>신용위험</strong>: OTC거래 상대방 디폴트 / <strong>유동성위험</strong>: 원하는 시점에 포지션 청산 어려움 / <strong>운영위험</strong>: 내부통제 실패, 오류, 사기(베어링은행, SG 사건 등). // 대표 실패사례 포인트 🡪 메탈게젤샤프트: 잘못된 헤지전략, P&amp;G: 복잡한 금리파생 이해 부족, 베어링은행·SG: 트레이더 일탈 + 내부통제 실패, KIKO: 환헤지 구조 오판으로 기업 손실, 글로벌 금융위기: CDO·CDS 등 구조화 파생이 부실·위험 확산.</p>"
    ],
    hl:[
      {id:'h1', paraIdx:9, start:0, end:8, who:'ji', note:'이 계산식 시험에 그대로 나올 듯, 외워두자'},
      {id:'h2', paraIdx:12, start:0, end:15, who:'seo', note:'이 부분 헷갈리는데 스터디 때 다시 설명해줄 사람 있나요?'}
    ]},
  {id:'d1', who:'ji',  name:'제안서_초안_2장.pptx', meta:'방금 · 2.4MB', co:['seo'], comments:[
    {who:'seo', text:'2페이지 색감 너무 좋아요 👍'}
  ]},
  {id:'d2', who:'seo', name:'제안서_초안_3장.pptx', meta:'4분 전 · 1.9MB', comments:[]},
  {id:'d3', who:'do',  name:'참고문헌.pdf', meta:'오늘 · 0.8MB', comments:[]},
  {id:'d4', who:'ha',  name:'제안서_초안_1장.pptx', meta:'어제 · 2.1MB', co:['do'], comments:[
    {who:'ji', text:'서론 논리 탄탄하네요. 다음 회의 때 한 번만 같이 다듬어요.'},
    {who:'do', text:'좋습니다!'}
  ]},
  {id:'d5', who:'ha',  name:'인터뷰_녹취.docx', meta:'2일 전 · 15MB', comments:[]},
  {id:'d6', who:'seo', name:'시장조사_자료.xlsx', meta:'3일 전 · 1.1MB', comments:[
    {who:'ha', text:'표 3번 수치 출처 하나만 더 붙여줄 수 있어요?'}
  ]},
  {id:'d7', who:'ji', name:'회의록_0922.pdf', meta:'오늘 · 0.3MB', comments:[], viewable:true,
    paragraphs:[
      {id:'pa1', text:'플랫폼 내 할 일 배분과 투표 기능을 포함시키기로 했으며, 최종 완성본 파일 업로드 및 공동 작업자 지정 기능만 유지하기로 결정했다.'},
      {id:'pa2', text:'기여도 정량 평가 항목은 문서 업로드, 할 일 완료 여부, 회의 및 투표 참여 횟수로 간소화하기로 했다.'},
      {id:'pa3', text:'접근성과 보안 문제를 고려해 플랫폼 내 채팅 기능은 제외하기로 합의했다.'},
      {id:'pa4', text:'사업 타겟층은 1순위 학교·기업, 2순위 개인 학생으로 설정하기로 했다.'},
      {id:'pa5', text:'기여도 증명서 기능은 보류하고, 관련 내용은 내일까지 더 고민하기로 했다.'}
    ],
    pcomments:{pa1:[], pa2:[{who:'seo', text:'투표 UI는 하린이 만든 시안 참고하면 좋을 것 같아요'}], pa3:[], pa4:[], pa5:[]}}
];
const uploadSamples = [
  {who:'ji', name:'표지_디자인.png'}, {who:'seo', name:'설문지_v2.docx'},
  {who:'ha', name:'참고사례_스크랩.pdf'}, {who:'do', name:'발표_스크립트.txt'}
];
let uploadSeq = 0;

/* native in-platform meetings — teams call directly inside 논프리라이더,
   and the recording + speaking time are logged automatically when the call ends */
let inCall = false, callSeconds = 0, callTimerRef = null, callMuted = {};
let meetings = [
  {id:'meet1', title:'1차 회의', topic:'주제 선정 · 역할 분배', date:'9/16 · 19:00–19:40', duration:'40분',
    recording:'1차_회의_녹음본.m4a',
    attendance:{ji:'present', seo:'present', ha:'present', do:'late'},
    speech:{ji:14, seo:12, ha:9, do:3}},
  {id:'meet2', title:'2차 회의', topic:'제안서 목차 · 기능 범위 정리', date:'9/23 · 19:00–19:58', duration:'58분',
    recording:'2차_회의_녹음본.m4a',
    attendance:{ji:'present', seo:'present', ha:'present', do:'absent'},
    speech:{ji:22, seo:18, ha:10, do:0}}
];

/* calendar (native — no external connector) */
const CAL_YEAR = 2026, CAL_MONTH = 8; // September (0-indexed)
const TODAY_DATE = 23;
const calendarEvents = [
  {date:20, label:'자료수집 완료일', type:'deadline', who:'seo'},
  {date:22, label:'백지 PPT 마감일', type:'deadline', who:'ji'},
  {date:24, label:'5장 결론 마감', type:'deadline', who:'ha'},
  {date:25, label:'발표 대본 마감', type:'deadline', who:'do'},
  {date:26, label:'3차 회의', type:'meeting'},
  {date:27, label:'최종 PPT 취합', type:'deadline', who:'ji'},
  {date:28, label:'PPT 디자인 마감', type:'deadline', who:'seo'},
  {date:29, label:'최종본 제출', type:'deadline', who:'ji'}
];

/* whentomeet: rows=time slots, cols=5 upcoming weekdays */
const WTM_DAYS = ['목 9/24','금 9/25','월 9/28','화 9/29','수 9/30'];
const WTM_SLOTS = ['18–19시','19–20시','20–21시','21–22시'];
let avail = {
  ji:  [[1,1,0,1,1],[1,0,0,1,1],[0,0,0,1,0],[0,0,0,0,0]],
  seo: [[1,1,1,0,1],[1,1,0,0,1],[1,0,0,0,1],[0,0,0,0,0]],
  ha:  [[0,1,1,1,1],[0,1,1,1,0],[0,0,1,1,0],[0,0,0,0,0]],
  do:  [[1,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0]]
};
let actingAs = 'ji';

/* ---------------- entry / project data ---------------- */
const studentProjects = [
  {id:'p1', course:'마케팅원론', team:'4조', title:'브랜드 리포지셔닝 제안서', dday:'D-3', active:true},
  {id:'p2', course:'경영전략론', team:'2조', title:'스타트업 사례분석', dday:'D-11', active:false},
  {id:'p3', course:'소비자행동론', team:'6조', title:'브랜드 설문조사 설계', dday:'D-20', active:false}
];
const professorCourses = [
  {course:'마케팅원론', teams:[
    {id:'p1', team:'4조', title:'브랜드 리포지셔닝 제안서', active:true},
    {id:'c1t1', team:'1조', title:'가격 전략 분석'},
    {id:'c1t2', team:'2조', title:'유통 채널 리서치'},
    {id:'c1t3', team:'3조', title:'광고 캠페인 기획'}
  ]},
  {course:'소비자행동론', teams:[
    {id:'c2t1', team:'1조', title:'구매결정요인 분석'},
    {id:'c2t2', team:'2조', title:'브랜드 설문조사 설계'}
  ]}
];
/* 학생이 초대 코드로 입장할 때 새로 생성되는 과목/팀 (현재 팀 리스트에는 없는 새로운 과목) */
const NEW_JOIN_COURSE = '데이터베이스개론';
const NEW_JOIN_TEAM = '5조';
const NEW_JOIN_TITLE = '학사관리 시스템 ERD 설계';
const NEW_JOIN_DDAY = 'D-9';
const NEW_JOIN_ID = 'joinedteam1';
/* 새 수업을 만들 때 함께 발급되는 초대 코드/링크 */
const INVITE_LINK_BASE = 'https://nonfreerider.app/join?code=';
function genInviteCode(){
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random()*chars.length)];
  return s;
}

/* ---------------- global nav state ---------------- */
let stage = 'role';   // role | project | placeholder | app
let role = null;      // student | professor
let loginRole = 'student'; // which tab is selected on the login screen
let profCourseSel = null;  // course name selected in the professor's course list step
let showNewCourseForm = false; // toggles the "새 수업 만들기" inline form
let newCourseInvite = null;    // {course, code} of the most recently created course, shown once as confirmation
let copiedCode = null;         // invite code currently showing a "복사됨" confirmation
let showJoinForm = false;      // toggles the student's "초대 코드로 입장하기" inline form
let joinMsg = null;            // {ok, text} feedback after attempting to join with a code
let projMeta = null;  // {course, team, title, dday}
let tab = 'home';
let memberDetailId = null; // set to open an individual member's detail panel
let docViewerId = null;    // set to open the annotation viewer for a document
let pcOpen = null;         // 'docId:paraId' of the paragraph comment box currently open
let pendingSel = null;     // {docId, paraIdx, start, end, text, x, y} — active text selection awaiting a comment
let openHl = null;         // id of the highlight comment card currently expanded
let parsing = false;       // true while a real file is being read/parsed
const STUDENT_TABS = [['home','할 일'],['calendar','캘린더'],['meeting','회의'],['docs','문서'],['peer','동료평가'],['records','기여기록']];
const PROFESSOR_TABS = [['home','현황'],['peerbuild','동료평가 문항'],['peerresults','동료평가 결과']];

/* ---------------- helpers ---------------- */
function overdueTask(){ return tasks.find(t => !t.done && t.overdue); }
function nextDue(){ return tasks.filter(t => !t.done && !t.overdue && t.dday).sort((a,b) => parseInt(a.dday.slice(2)) - parseInt(b.dday.slice(2)))[0]; }
function nextCalEvent(){ return calendarEvents.filter(e => e.date >= TODAY_DATE).sort((a,b)=>a.date-b.date)[0]; }

/* ---------------- ENTRY SCREENS ---------------- */
function screenRole(){
  const isStudent = loginRole === 'student';
  return `<div class="entrywrap">
    <div class="logo">논프리라이더</div>
    <div class="sub">로그인하고 팀 프로젝트를 확인해요 (concept demo)</div>
    <div class="logintabs">
      <button class="logintab ${isStudent?'on':''}" data-logintab="student" type="button"><span class="ic">🎓</span>학생 로그인</button>
      <button class="logintab ${!isStudent?'on':''}" data-logintab="professor" type="button"><span class="ic">🧑‍🏫</span>교수 로그인</button>
    </div>
    <form class="loginform" data-loginform>
      <label class="fieldlabel">${isStudent ? '학번 또는 이메일' : '교수 이메일'}</label>
      <input class="logininput" type="text" placeholder="${isStudent ? '학번 또는 이메일 입력' : '이메일 입력'}" autocomplete="username">
      <label class="fieldlabel">비밀번호</label>
      <input class="logininput" type="password" placeholder="비밀번호 입력" autocomplete="current-password">
      <button type="button" class="loginbtn" data-do-login="${loginRole}">${isStudent ? '학생으로 로그인' : '교수로 로그인'}</button>
    </form>
    <p class="loginhint">개념 시연용 화면이에요. 아무 값이나 입력하고 로그인을 누르면 바로 진행돼요.</p>
  </div>`;
}

function screenProjectStudent(){
  const rows = studentProjects.map(p => `
    <div class="pcard ${p.active?'':'inactive'}" data-openproj="${p.id}">
      <div class="pinfo"><b>${p.course} · ${p.team}</b><span>${esc(p.title)}</span></div>
      <span class="dday">${p.dday}</span>
    </div>`).join('');
  return `<div class="projwrap">
    <h2>진행 중인 팀 프로젝트</h2>
    <div class="sub">참여 중인 프로젝트 중 하나를 선택하세요</div>
    ${rows}
    ${joinMsg ? `<div class="note ${joinMsg.ok?'':'warn'}" style="margin-top:12px">${esc(joinMsg.text)}</div>` : ''}
    ${showJoinForm ? `<div class="cmtform" style="margin-top:10px">
        <input type="text" placeholder="교수님께 받은 초대 코드 입력" data-joininput style="text-transform:uppercase">
        <button data-joinsubmit>입장하기</button>
      </div>`
      : `<button class="linklike" data-jointoggle style="display:block;margin-top:14px">+ 초대 코드로 새 프로젝트 입장하기</button>`}
    <button class="linklike" data-back-role style="display:block;margin-top:10px">← 역할 다시 선택하기</button>
  </div>`;
}

function screenProjectProfessor(){
  if (!profCourseSel){
    const rows = professorCourses.map(c => `
      <div class="pcard" data-selectcourse="${esc(c.course)}">
        <div class="pinfo"><b>${esc(c.course)}</b><span>${c.teams.length}개 조 진행 중</span></div>
        <span class="dday">›</span>
      </div>`).join('');
    return `<div class="projwrap">
      <h2>담당 수업</h2>
      <div class="sub">조회할 수업을 선택하세요</div>
      ${newCourseInvite ? `<div class="card" style="margin-bottom:12px">
        <div class="small" style="font-weight:700;margin-bottom:6px">✅ "${esc(newCourseInvite.course)}" 수업이 만들어졌어요</div>
        <div class="small muted" style="margin-bottom:8px">아래 초대 코드나 링크를 학생들에게 공유해서 이 수업으로 초대하세요.</div>
        <div class="pchip" style="font-size:14px;padding:6px 12px;margin-bottom:8px">${newCourseInvite.code}</div><br>
        <button class="linklike" data-copycode="${newCourseInvite.code}">${copiedCode===newCourseInvite.code ? '✅ 복사됨' : '🔗 초대 링크 복사'}</button>
        <button class="linklike" data-dismissinvite style="margin-left:10px">닫기</button>
      </div>` : ''}
      ${rows}
      ${showNewCourseForm ? `<div class="cmtform" style="margin-top:10px">
        <input type="text" placeholder="새 수업 이름 (예: 조직행동론)" data-newcourseinput>
        <button data-newcoursesubmit>만들기</button>
      </div>` : `<button class="linklike" data-newcoursetoggle style="display:block;margin-top:14px">+ 새 팀 프로젝트 수업 만들기</button>`}
      <button class="linklike" data-back-role style="display:block;margin-top:10px">← 역할 다시 선택하기</button>
    </div>`;
  }
  const course = professorCourses.find(c => c.course === profCourseSel);
  const chips = course.teams.map(t => `<div class="teamchip" data-openproj="${t.id}">${t.team} · ${esc(t.title)}</div>`).join('');
  return `<div class="projwrap">
    <h2>${esc(course.course)}</h2>
    <div class="sub">열람할 조를 선택하세요</div>
    ${course.inviteCode ? `<div class="card" style="margin-bottom:12px">
      <div class="small muted" style="margin-bottom:6px">이 수업의 초대 코드</div>
      <div class="pchip" style="font-size:14px;padding:6px 12px;margin-bottom:8px">${course.inviteCode}</div><br>
      <button class="linklike" data-copycode="${course.inviteCode}">${copiedCode===course.inviteCode ? '✅ 복사됨' : '🔗 초대 링크 복사'}</button>
    </div>` : ''}
    ${chips ? `<div class="teamrow">${chips}</div>` : '<div class="empty">아직 참여한 조가 없어요. 학생에게 초대 코드를 공유해 보세요.</div>'}
    <button class="linklike" data-back-course style="margin-top:14px">← 수업 목록으로</button>
  </div>`;
}

function screenPlaceholder(){
  return `<div class="projwrap">
    <div class="placeholder">이 프로젝트는 데모에 준비되어 있지 않아요.<br>아래 버튼으로 예시가 구현된 프로젝트로 돌아가 주세요.</div>
    <button class="linklike" data-back-proj style="margin-top:14px">← 프로젝트 목록으로</button>
  </div>`;
}

/* ---------------- APP: 1. 할 일 ---------------- */
let taskView = 'mine'; // mine | team
function taskRow(t){
  const badge = t.done ? `<span class="datebadge done2">완료</span>`
    : t.overdue ? `<span class="datebadge due">${t.date} · 기한 초과</span>`
    : `<span class="datebadge ${parseInt(t.dday.slice(2)) <= 3 ? 'due':'later'}">${t.date} · ${t.dday}</span>`;
  return `<div class="task ${t.done?'done':''}">
    <div class="cb ${t.done?'done':''}" data-taskcheck="${t.id}"></div>
    <div class="body"><div class="ttl">${esc(t.title)}</div></div>${badge}</div>`;
}
function viewHome(){
  const od = overdueTask(); const nd = nextDue();
  let banner;
  if (od){
    banner = `<section class="card banner"><div class="top2"><div>
      <div class="eyebrow">${projMeta.course} · ${projMeta.team} · ${esc(projMeta.title)}</div>
      <h1>기한이 지난 할 일이 있어요</h1><div class="sub3">${esc(od.title)} · 담당 ${mem(od.who).name}</div>
      </div><span class="dday">기한 초과</span></div></section>`;
  } else if (nd){
    banner = `<section class="card banner"><div class="top2"><div>
      <div class="eyebrow">${projMeta.course} · ${projMeta.team} · ${esc(projMeta.title)}</div>
      <h1>다음 마감은 ${esc(nd.title)}이에요</h1><div class="sub3">담당 ${mem(nd.who).name} · 마감 전날 알림이 가요</div>
      </div><span class="dday">${nd.dday}</span></div></section>`;
  } else {
    banner = `<section class="card banner"><h1>모든 할 일을 마쳤어요 🎉</h1></section>`;
  }
  const strip = `<div class="people memberstrip">${members.map(m => {
    const mt = tasks.filter(t => t.who === m.id), dn = mt.filter(t => t.done).length;
    return `<div class="person ${m.id===actingAs?'me':''}" style="--mc:${m.c}"><span class="dot" style="background:${m.c}"></span><b>${m.name}</b><span class="role">${m.role} · ${dn}/${mt.length}</span></div>`;
  }).join('')}</div>`;
  const seg = `<div class="seg"><button class="${taskView==='mine'?'on':''}" data-taskview="mine">내 할 일</button><button class="${taskView==='team'?'on':''}" data-taskview="team">팀별 할 일</button></div>`;
  let list;
  if (taskView === 'mine'){
    const mt = tasks.filter(t => t.who === actingAs);
    list = mt.length ? mt.map(taskRow).join('') : `<div class="empty">맡은 할 일이 없어요.</div>`;
  } else {
    list = members.map(m => {
      const mt = tasks.filter(t => t.who === m.id), dn = mt.filter(t => t.done).length;
      return `<div class="tgroup"><div class="tghead" style="border-color:${m.c}"><span class="dot" style="background:${m.c}"></span>${m.name}<span class="role">${m.role}</span><span class="cnt">${dn}/${mt.length} 완료</span></div>
        ${mt.length ? mt.map(taskRow).join('') : `<div class="empty">맡은 할 일이 없어요.</div>`}</div>`;
    }).join('');
  }
  return `${strip}${banner}
  <section class="card"><h2>할 일과 마감</h2>
    ${seg}
    <p class="small muted" style="margin:0 0 6px">완료 체크는 담당자가 직접 해요. 이 업로드물에 대한 댓글이 실제 진행 증거로 남아요 — '문서' 탭을 확인해보세요.</p>
    ${taskView==='mine' ? `<h3 style="margin:10px 0 0">${mem(actingAs).name}의 할 일</h3>` : ''}
    ${list}
  </section>`;
}

/* ---------------- APP: 2. 캘린더 (월간 + whentomeet) ---------------- */
function buildMonthGrid(){
  const first = new Date(CAL_YEAR, CAL_MONTH, 1);
  const startDow = first.getDay();
  const daysInMonth = new Date(CAL_YEAR, CAL_MONTH+1, 0).getDate();
  const cells = [];
  for (let i=0;i<startDow;i++) cells.push(`<div class="mcell blank"></div>`);
  for (let d=1; d<=daysInMonth; d++){
    const evs = calendarEvents.filter(e => e.date === d);
    cells.push(`<div class="mcell ${d===TODAY_DATE?'today':''}">
      <div class="dnum">${d}</div>
      ${evs.map(e => { const m = e.who ? mem(e.who) : null; return `<div class="mev ${e.type} ${m?'own':''}" ${m?`style="--mc:${m.c}"`:''} title="${m?m.name+' · ':''}${esc(e.label)}">${esc(e.label)}</div>`; }).join('')}
    </div>`);
  }
  return `<div class="monthgrid">${['일','월','화','수','목','금','토'].map(d=>`<div class="mdow">${d}</div>`).join('')}${cells.join('')}</div>`;
}
function viewCalendar(){
  const ne = nextCalEvent();
  const banner = ne ? `<section class="card banner"><div class="top2"><div>
      <div class="eyebrow">가장 가까운 일정</div>
      <h1>${esc(ne.label)}</h1><div class="sub3">9월 ${ne.date}일 · ${ne.type==='meeting'?'회의':'마감'}${ne.who?' · 담당 '+mem(ne.who).name:''}</div>
      </div><span class="dday">D-${ne.date-TODAY_DATE}</span></div></section>` : '';

  const month = `<section class="card">
    <div class="monthhead"><b>9월 2026</b><span class="small muted">팀 전체 공유 캘린더</span></div>
    ${buildMonthGrid()}
    <div class="mlegend">${members.map(m => `<span><i style="background:${m.c}"></i>${m.name}</span>`).join('')}<span><i style="background:var(--good)"></i>회의</span></div>
  </section>`;

  const counts = WTM_SLOTS.map((_,si) => WTM_DAYS.map((_,di) => members.reduce((s,m)=>s+avail[m.id][si][di],0)));
  const max = Math.max(...counts.flat());
  const bestSlots = [];
  counts.forEach((row,si)=>row.forEach((c,di)=>{ if(c===max && max>0) bestSlots.push(`${WTM_DAYS[di]} ${WTM_SLOTS[si]}`); }));

  const wtmRows = WTM_SLOTS.map((slot,si) => `
    <div class="wtmtime">${slot}</div>
    ${WTM_DAYS.map((_,di) => {
      const c = counts[si][di];
      const mine = avail[actingAs][si][di];
      const isBest = c===max && max>0;
      const bg = c===0 ? 'var(--soft)' : `color-mix(in srgb, var(--good) ${Math.round(c/members.length*80+15)}%, var(--soft))`;
      return `<div class="wtmcell ${isBest?'best':''}" data-wtm="${si}-${di}" style="background:${bg};${mine?'font-weight:700;color:var(--ink)':''}">${c || ''}</div>`;
    }).join('')}
  `).join('');

  const wtm = `<section class="card">
    <h2>언제 만날까요</h2>
    <p class="small muted" style="margin:0 0 4px">아래에서 <b>${mem(actingAs).name}</b>(으)로 가능한 시간대를 선택해보세요. 셀 숫자는 지금까지 선택한 팀원 수예요.</p>
    <div class="wtmgrid">
      <div></div>${WTM_DAYS.map(d=>`<div class="wtmhead">${d}</div>`).join('')}
      ${wtmRows}
    </div>
    ${bestSlots.length ? `<div class="wtmresult">✅ 팀 추천 시간 (${max}명 가능): ${bestSlots.join(', ')}</div>` : ''}
  </section>`;

  return banner + month + wtm;
}

/* ---------------- APP: 3. 회의 (플랫폼 내 자체 통화 + 녹음본/발언시간) ---------------- */
function viewMeeting(){
  const rows = meetings.slice().reverse().map(mt => {
    const total = Object.values(mt.speech).reduce((a,b)=>a+b,0) || 1;
    return `<div class="meetrec">
      <div class="meetrechead">
        <div><div class="mttl">${esc(mt.title)}</div><div class="mmeta">${mt.date} · ${mt.duration}</div><div class="mtopic">📌 ${esc(mt.topic)}</div></div>
        <button class="recbtn" data-playrec="${mt.id}">🎙️ ${esc(mt.recording)}</button>
      </div>
      <div class="speechlist">
        ${members.map(m => {
          const min = mt.speech[m.id] || 0;
          const pct = Math.round(min/total*100);
          const st = mt.attendance[m.id];
          const stTxt = st === 'absent' ? '불참' : st === 'late' ? '지각' : '';
          return `<div class="speechrow">
            <span class="who"><span class="dot" style="background:${m.c}"></span>${m.name}${stTxt?` <span class="muted">· ${stTxt}</span>`:''}</span>
            <div class="speechbar"><div class="speechfill" style="width:${pct}%;background:${m.c}"></div></div>
            <b class="speechmin">${min}분</b>
          </div>`;
        }).join('')}
      </div>
    </div>`;
  }).join('') || `<div class="empty">지난 회의 기록이 없어요.</div>`;

  if (inCall){
    const mm = String(Math.floor(callSeconds/60)).padStart(2,'0'), ss = String(callSeconds%60).padStart(2,'0');
    return `<section class="card callroom">
      <div class="calltop"><span class="live"><span class="reddot"></span>회의 진행 중</span><span class="timer" id="callTimer">${mm}:${ss}</span></div>
      <div class="callgrid">${members.map(m => `
        <div class="callpx"><div class="av" style="background:${m.c}">${m.name[0]}</div><div class="nm">${m.name}</div>
          <div class="mic ${callMuted[m.id]?'off':''}" data-callmic="${m.id}">${callMuted[m.id] ? '🔇 음소거' : '🎙️ 발언 가능'}</div></div>`).join('')}
      </div>
      <button class="endcallbtn" data-endcall>회의 종료</button>
    </section>`;
  }
  return `<section class="card meetstartcard">
    <div class="meetlinktop"><div class="meeticon">📹</div>
      <div><h2 style="margin:0">회의 시작하기</h2>
      <p class="small muted" style="margin:2px 0 0">논프리라이더 안에서 바로 팀 회의를 열어요. 회의가 끝나면 녹음본과 발언 시간이 자동으로 기록돼요.</p></div>
    </div>
    <button class="meetlinkbtn" data-startcall>회의 시작</button>
  </section>
  <section class="card">
    <h2>회의록 · 녹음본</h2>
    <p class="small muted" style="margin:0 0 10px">날짜별 녹음본과 참여자별 발언 시간을 확인할 수 있어요.</p>
    ${rows}
    <div class="toast" id="recToast">이 데모에는 실제 녹음 파일이 연결되어 있지 않아요.</div>
  </section>`;
}

/* ---------------- APP: 4. 문서 + 댓글 ---------------- */
function extOf(name){ return name.split('.').pop().toUpperCase(); }
let docFilter = 'all', openCmts = {}, coOpen = null;
const EXT_COLOR = {PPTX:'#E8563F', PDF:'#D93F5C', DOCX:'#2F6BFF', XLSX:'#12A379', PNG:'#8E63E8', TXT:'#7A869C'};
const personChip = m => `<span class="pchip"><span class="dot" style="background:${m.c}"></span>${m.name}</span>`;
function viewDocs(){
  if (docViewerId) return screenDocViewer(docViewerId);
  const list = docs.filter(d => docFilter === 'all' || d.who === docFilter || (d.co||[]).includes(docFilter));
  const filters = `<div class="docfilter"><button class="fchip ${docFilter==='all'?'on':''}" data-docfilter="all">전체 ${docs.length}</button>${members.map(m => `<button class="fchip ${docFilter===m.id?'on':''}" data-docfilter="${m.id}"><span class="dot" style="background:${m.c}"></span>${m.name}</button>`).join('')}</div>`;
  const cards = list.map((d,i) => {
    const m = mem(d.who), co = d.co || [], ext = extOf(d.name), col = EXT_COLOR[ext] || '#7A869C';
    const cand = members.filter(x => x.id !== d.who && !co.includes(x.id));
    return `<div class="dcard" style="animation-delay:${i*40}ms">
      <div class="dtop">
        <div class="ficon" style="background:color-mix(in srgb, ${col} 16%, var(--surface));color:${col}">${ext}</div>
        <div class="body"><div class="ttl">${esc(d.name)}</div><div class="meta">${d.meta}</div></div>
        ${d.viewable ? `<button class="docviewbtn" data-opendoc="${d.id}">미리보기 · 첨삭</button>` : ''}
      </div>
      <div class="dpeople">
        <span class="plabel">작성</span>${personChip(m)}
        ${co.length ? `<span class="plabel" style="margin-left:6px">공동작업</span>${co.map(id => `<span class="pchip"><span class="dot" style="background:${mem(id).c}"></span>${mem(id).name}<button class="x" data-coremove="${d.id}:${id}" aria-label="공동작업자 제거">×</button></span>`).join('')}` : ''}
        <button class="coadd ${coOpen===d.id?'on':''}" data-cotoggle="${d.id}">＋ 공동작업자${co.length?'':' 추가'}</button>
      </div>
      ${coOpen === d.id ? `<div class="copicker">${cand.length ? `추가할 팀원을 선택하세요 ${cand.map(x => `<button class="pchip pick" data-coadd="${d.id}:${x.id}"><span class="dot" style="background:${x.c}"></span>${x.name} ＋</button>`).join('')}` : '팀원이 모두 추가됐어요.'}</div>` : ''}
      <button class="cmttoggle" data-cmttoggle="${d.id}">💬 댓글 ${d.comments.length}개 ${openCmts[d.id] ? '▴' : '▾'}</button>
      ${openCmts[d.id] ? `<div class="comments">
        ${d.comments.map(c => `<div class="cmt"><b><span class="dot" style="background:${mem(c.who).c}"></span> ${mem(c.who).name}</b><span>${esc(c.text)}</span></div>`).join('')}
        <div class="cmtform">
          <input type="text" placeholder="${mem(actingAs).name}(으)로 댓글 남기기…" data-cmtinput="${d.id}">
          <button data-cmtsend="${d.id}">등록</button>
        </div></div>` : ''}
    </div>`;
  }).join('') || `<div class="empty">해당 팀원의 문서가 없어요.</div>`;
  return `<section class="card">
    <div class="dropzone" id="dropzone">
      <div class="ic">⬆️</div><div class="t1">${parsing ? '문서를 읽는 중…' : '여기를 눌러 PDF·DOCX·PPTX 파일을 업로드하세요'}</div>
      <div class="t2">문장을 드래그해서 선택하면, 구글독스 첨삭처럼 그 부분에 메모를 남길 수 있어요</div>
      <div class="dzhint"><span class="tag">PDF</span><span class="tag">DOCX</span><span class="tag">PPTX</span></div>
    </div>
    <input type="file" id="realFileInput" accept=".pdf,.docx,.pptx" style="display:none">
    <h2>업로드된 문서</h2>
    <p class="small muted" style="margin:0 0 12px">팀원의 댓글이 리뷰·기여 증거로 쌓여요. 공동작업자로 등록된 팀원도 기여로 기록돼요. PDF·DOCX·PPTX는 문장 단위 첨삭 메모도 가능해요.</p>
    ${filters}
    ${cards}
  </section>`;
}

/* ---------------- document annotation (Google Docs-style comments) ---------------- */
function screenDocViewer(docId){
  const d = docs.find(x => x.id === docId);
  if (d.real) return screenRealDocViewer(d);
  const body = d.paragraphs.map(p => {
    const cs = d.pcomments[p.id] || [];
    const key = d.id+':'+p.id;
    return `<div class="para ${cs.length?'commented':''}">
      <button class="paddbtn" data-pctoggle="${key}">💬 메모</button>
      <div class="ptxt">${esc(p.text)}</div>
      ${cs.length ? `<div class="pnotewrap">${cs.map(c => `<div class="pnote"><b><span class="dot" style="background:${mem(c.who).c}"></span> ${mem(c.who).name}</b>${esc(c.text)}</div>`).join('')}</div>` : ''}
      ${pcOpen === key ? `<div class="pcform"><input type="text" placeholder="${mem(actingAs).name}(으)로 이 문단에 메모 남기기…" data-pcinput="${key}"><button data-pcsend="${key}">등록</button></div>` : ''}
    </div>`;
  }).join('');
  return `<section class="card"><div class="detailhead"><h2>${esc(d.name)}</h2><button class="linklike" data-closedoc>← 문서 목록</button></div>
    <p class="small muted" style="margin:0 0 10px">구글독스 첨삭처럼, 문단에 마우스를 올리고 💬 메모를 눌러 그 구간을 콕 집어 메모를 남길 수 있어요.</p>
    <div class="docpaper">${body}</div></section>`;
}

/* ---------------- real-file viewer: original formatting preserved, select any range of text to attach a comment ---------------- */
// d.rich === true  -> paragraph is an HTML block straight from the source file (bold/headings/lists kept)
// d.rich falsy     -> paragraph is plain extracted text (pdf/pptx, which have no reliable in-browser HTML form)
function makeOffscreen(content, rich){
  const div = document.createElement('div');
  if (rich) div.innerHTML = content; else div.textContent = content;
  return div;
}
function pointAtOffset(root, target){
  let total = 0, result = null;
  (function walk(n){
    if (result) return;
    if (n.nodeType === 3){
      const len = n.textContent.length;
      if (target <= total + len){ result = {node: n, offset: target - total}; return; }
      total += len;
    } else for (const c of n.childNodes){ walk(c); if (result) return; }
  })(root);
  if (!result){
    let last = null;
    (function w(n){ if (n.nodeType === 3) last = n; else n.childNodes.forEach(w); })(root);
    if (last) result = {node: last, offset: last.textContent.length};
  }
  return result;
}
function quoteFor(content, rich, start, end){
  const root = makeOffscreen(content, rich);
  const s = pointAtOffset(root, start), e = pointAtOffset(root, end);
  if (!s || !e) return '';
  const r = document.createRange(); r.setStart(s.node, s.offset); r.setEnd(e.node, e.offset);
  return r.toString();
}
function applyHighlight(container, hl){
  const s = pointAtOffset(container, hl.start), e = pointAtOffset(container, hl.end);
  if (!s || !e) return;
  const range = document.createRange();
  range.setStart(s.node, s.offset); range.setEnd(e.node, e.offset);
  const mark = document.createElement('mark');
  mark.className = 'hlmark' + (hl.id === openHl ? ' open' : '');
  mark.dataset.hlopen = hl.id;
  mark.appendChild(range.extractContents());
  range.insertNode(mark);
}
function paintHighlights(){
  document.querySelectorAll('.ptxt[data-real]').forEach(el => {
    const d = docs.find(x => x.id === el.dataset.doc);
    if (!d) return;
    const paraIdx = +el.dataset.para;
    d.hl.filter(h => h.paraIdx === paraIdx).sort((a,b) => a.start - b.start).forEach(h => applyHighlight(el, h));
  });
}
function screenRealDocViewer(d){
  const body = d.paragraphs.map((content, i) => {
    const hlsHere = d.hl.filter(h => h.paraIdx === i);
    const openHere = hlsHere.find(h => h.id === openHl);
    const showPopup = pendingSel && pendingSel.docId === d.id && pendingSel.paraIdx === i;
    return `<div class="realpara">
      <div class="ptxt" data-real data-doc="${d.id}" data-para="${i}">${d.rich ? content : esc(content)}</div>
      ${showPopup ? (pendingSel.adding
        ? `<div class="selpopup selform" style="left:${pendingSel.x}px;top:${pendingSel.y}px"><input type="text" id="hlAddInput" placeholder="메모 남기기…"><button data-hlsubmit>등록</button></div>`
        : `<button class="selpopup" style="left:${pendingSel.x}px;top:${pendingSel.y}px" data-addhl>💬 메모 추가</button>`) : ''}
      ${openHere ? `<div class="hlnotecard">
          <div class="quote">${esc(quoteFor(content, d.rich, openHere.start, openHere.end))}</div>
          <div class="note"><b><span class="dot" style="background:${mem(openHere.who).c}"></span> ${mem(openHere.who).name}</b>${esc(openHere.note)}</div>
        </div>` : ''}
    </div>`;
  }).join('');
  return `<section class="card"><div class="detailhead"><h2>${esc(d.name)}</h2><button class="linklike" data-closedoc>← 문서 목록</button></div>
    <p class="small muted" style="margin:0 0 10px">원본처럼 흰 바탕에 서식 그대로 표시돼요. 문장을 마우스로 드래그해서 선택하면 "💬 메모 추가" 버튼이 떠요. 이미 메모가 달린 부분은 밑줄 친 구간을 눌러 확인하세요.</p>
    <div class="docpaper">${body}</div></section>`;
}
function offsetIn(root, node, offset){
  let total = 0, found = false;
  (function walk(n){
    if (found) return;
    if (n.nodeType === 3){ if (n === node){ total += offset; found = true; } else total += n.textContent.length; }
    else for (const c of n.childNodes){ walk(c); if (found) return; }
  })(root);
  return total;
}
document.addEventListener('mouseup', e => {
  const wrap = e.target.closest && e.target.closest('.ptxt[data-real]');
  if (!wrap){ return; }
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || sel.rangeCount === 0 || sel.toString().trim() === ''){
    if (pendingSel){ pendingSel = null; render(); }
    return;
  }
  const range = sel.getRangeAt(0);
  if (!wrap.contains(range.commonAncestorContainer)) return;
  const start = offsetIn(wrap, range.startContainer, range.startOffset);
  const end = offsetIn(wrap, range.endContainer, range.endOffset);
  if (end <= start) return;
  const docId = wrap.dataset.doc, paraIdx = +wrap.dataset.para;
  const box = wrap.closest('.realpara');
  const r = range.getBoundingClientRect(), br = box.getBoundingClientRect();
  pendingSel = { docId, paraIdx, start, end, x: Math.round(r.left + r.width/2 - br.left), y: Math.round(r.bottom - br.top) + 4 };
  render();
});
function splitBlocks(html){
  const div = document.createElement('div');
  div.innerHTML = html;
  return Array.from(div.children).map(el => el.outerHTML).filter(h => h.replace(/<[^>]+>/g,'').trim());
}
function extractParasFromArrayBuffer(kind, buf){
  // docx: convertToHtml keeps bold/headings/lists as they appear in the original file (d.rich = true)
  if (kind === 'docx') return mammoth.convertToHtml({arrayBuffer: buf}).then(r => splitBlocks(r.value));
  // pdf/pptx have no reliable in-browser "original formatting" form — extracted as plain text per page/slide
  if (kind === 'pdf') return pdfjsLib.getDocument({data: buf}).promise.then(async pdf => {
    const paras = [];
    for (let i = 1; i <= pdf.numPages; i++){
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const t = content.items.map(it => it.str).join(' ').replace(/\s+/g, ' ').trim();
      if (t) paras.push(`[${i}페이지] ` + t);
    }
    return paras;
  });
  if (kind === 'pptx') return JSZip.loadAsync(buf).then(async zip => {
    const names = Object.keys(zip.files).filter(n => /^ppt\/slides\/slide\d+\.xml$/.test(n))
      .sort((a,b) => (+a.match(/\d+/)[0]) - (+b.match(/\d+/)[0]));
    const paras = [];
    for (const n of names){
      const xml = await zip.files[n].async('text');
      const texts = [...xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map(m => m[1]).join(' ').trim();
      if (texts) paras.push(`[슬라이드 ${names.indexOf(n)+1}] ` + texts);
    }
    return paras;
  });
  return Promise.resolve([]);
}
async function handleRealUpload(file){
  const ext = file.name.split('.').pop().toLowerCase();
  if (!['pdf','docx','pptx'].includes(ext)){ alert('PDF, DOCX, PPTX 파일만 업로드할 수 있어요.'); return; }
  parsing = true; render();
  try{
    const buf = await file.arrayBuffer();
    const paras = await extractParasFromArrayBuffer(ext, buf);
    parsing = false;
    if (!paras.length){ alert('문서에서 텍스트를 추출하지 못했어요. 다른 파일로 시도해 보세요.'); render(); return; }
    const id = 'ru' + Date.now();
    docs.unshift({id, who: actingAs, name: file.name, meta:'방금 업로드 · ' + (file.size/1024/1024).toFixed(1) + 'MB', comments:[], viewable:true, real:true, rich: ext==='docx', paragraphs: paras, hl:[]});
    docViewerId = id; pendingSel = null; openHl = null;
    render();
  }catch(err){
    console.error(err);
    parsing = false;
    alert('파일을 읽는 중 문제가 발생했어요: ' + (err && err.message || err));
    render();
  }
}
document.addEventListener('change', e => {
  if (e.target && e.target.id === 'realFileInput' && e.target.files && e.target.files[0]){
    handleRealUpload(e.target.files[0]);
    e.target.value = '';
  }
});

/* ---------------- APP: 5. 동료평가 ---------------- */
function viewPeer(){
  const others = members.filter(m => m.id !== actingAs);
  const submitted = peerSubmitted[actingAs];
  return `<section class="card">
    <div class="detailhead"><h2>동료평가</h2>${submitted ? `<span class="chip verified">제출 완료</span>` : `<span class="chip absent">미제출</span>`}</div>
    <p class="small muted" style="margin:0 0 4px">교수님이 만든 문항으로 팀원을 평가해요. 자동 기록과 합산되지 않는 별도 지표예요.</p>
    ${others.map(m => {
      const ans = (peerAnswers[actingAs] && peerAnswers[actingAs][m.id]) || {scores:{}, note:''};
      const avg = (() => { const vals = peerQuestions.map(q => ans.scores[q.id]).filter(v => v != null);
        return vals.length ? (vals.reduce((a,b)=>a+b,0)/vals.length) : null; })();
      return `<div class="peercard">
        <div class="peerhead"><b><span class="dot" style="background:${m.c}"></span> ${m.name}</b><span class="avgpill">${avg!=null ? '평균 '+avg.toFixed(1) : '미평가'}</span></div>
        ${peerQuestions.map(q => `
          <div class="critq">
            <div class="lbl">${esc(q.text)}</div>
            <div class="scale5">${peerScaleLabels.map((lbl,i) => {
              const v = i+1;
              return `<button class="scalebtn ${ans.scores[q.id]===v?'on':''}" data-peerscore="${m.id}:${q.id}:${v}">${lbl}</button>`;
            }).join('')}</div>
          </div>`).join('')}
        <textarea class="peernote" placeholder="자유롭게 의견을 남겨주세요 (선택)" data-peernote="${m.id}">${esc(ans.note||'')}</textarea>
      </div>`;
    }).join('')}
    <button class="submitbtn" id="peerSubmitBtn">동료평가 제출</button>
    <div class="toast" id="peerToast">제출됐어요. (데모라 실제로 저장되지는 않아요)</div>
  </section>`;
}

/* ---------------- APP: professor · 동료평가 문항 제작 ---------------- */
function viewPeerBuild(){
  const rows = peerQuestions.map(q => `
    <div class="qrow">
      <input class="qinput" type="text" value="${esc(q.text)}" data-qedit="${q.id}">
      <button class="qdel" data-qdel="${q.id}" ${peerQuestions.length<=1?'disabled':''}>삭제</button>
    </div>`).join('');
  return `<section class="card">
    <h2>동료평가 문항 제작</h2>
    <p class="small muted" style="margin:0 0 10px">여기서 만들거나 수정한 문항이 학생용 동료평가 화면에 바로 반영돼요.</p>
    <div class="qlist">${rows}</div>
    <div class="qaddrow">
      <input class="qinput" type="text" id="qNewInput" placeholder="새 문항 입력 (예: 협업 태도)">
      <button class="qadd" id="qAddBtn">문항 추가</button>
    </div>
  </section>
  <section class="card">
    <h3>평가 척도</h3>
    <p class="small muted" style="margin:0 0 10px">모든 문항은 아래 5단계 척도로 통일돼서 학생이 선택해요. (기존 0.1 단위 슬라이더 대신)</p>
    <div class="scale5">${peerScaleLabels.map(l => `<span class="scalebtn on" style="cursor:default">${l}</span>`).join('')}</div>
  </section>`;
}

/* ---------------- APP: professor · 동료평가 결과 ---------------- */
function viewPeerResults(){
  const submittedCount = members.filter(m => peerSubmitted[m.id]).length;
  return `<section class="card">
    <h2>동료평가 결과</h2>
    <p class="small muted" style="margin:0 0 8px">문항별·팀원별 평균과 익명 응답을 확인할 수 있어요. 이름을 눌러도 개인 상세에서 동일한 내용을 볼 수 있어요.</p>
    <p class="small muted" style="margin:0 0 6px">제출 현황 ${submittedCount}/${members.length}명</p>
    <div class="submitgrid">${members.map(m => `<span class="chip ${peerSubmitted[m.id]?'verified':'absent'}">${m.name} ${peerSubmitted[m.id]?'제출':'미제출'}</span>`).join('')}</div>
  </section>
  ${members.map((m,i) => {
    const overall = peerOverallAvg(m.id);
    const others = members.filter(x => x.id !== m.id);
    const breakRows = peerQuestions.map(q => {
      const qa = peerQuestionAvg(m.id, q.id);
      return `<div class="qbreakrow"><span class="lbl">${esc(q.text)}</span><b>${qa!=null ? qa.toFixed(1) : '-'}</b></div>`;
    }).join('');
    const answerRows = others.map((ev,idx) => {
      const a = peerAnswers[ev.id] && peerAnswers[ev.id][m.id];
      if (!a) return `<div class="peerrow"><div class="who">학생 ${idx+1}</div><div class="scores muted">미제출</div></div>`;
      const scoresTxt = peerQuestions.map(q => `${esc(q.text)} <b>${a.scores[q.id]!=null ? a.scores[q.id]+'/5' : '-'}</b>`).join(' · ');
      return `<div class="peerrow"><div class="who">학생 ${idx+1}</div><div class="scores">${scoresTxt}</div>${a.note ? `<div class="note2">"${esc(a.note)}"</div>` : ''}</div>`;
    }).join('');
    return `<section class="card">
      <div class="peerhead"><b><span class="dot" style="background:${m.c}"></span> ${m.name}</b><span class="avgpill">평균 ${overall.toFixed(1)}</span></div>
      <div class="qbreak">${breakRows}</div>
      ${answerRows}
    </section>`;
  }).join('')}`;
}

/* ---------------- status ---------------- */
function computeStatus(){
  const status = {};
  const totalMeetings = meetings.length;
  members.forEach(m => {
    const mine = tasks.filter(t => t.who === m.id);
    const doneCount = mine.filter(t => t.done).length;
    const hasOverdue = mine.some(t => !t.done && t.overdue);
    let attendedCount = 0, lateCount = 0;
    meetings.forEach(mt => { const st = mt.attendance[m.id]; if (st==='present'||st==='late') attendedCount++; if (st==='late') lateCount++; });
    const latest = meetings[totalMeetings-1];
    const attended = latest ? latest.attendance[m.id] !== 'absent' : null;
    const spoke = latest ? (latest.speech[m.id] > 0) : null;
    const docCount = docs.filter(d => d.who === m.id).length;
    const quota = docQuota[m.id] || docCount;
    const speechMin = meetings.reduce((sum, mt) => sum + (mt.speech[m.id] || 0), 0);
    const avg = peerOverallAvg(m.id);
    const goodRecord = doneCount >= 1 && attended !== false && !hasOverdue;
    const poorRecord = hasOverdue || attended === false;
    let flag = null;
    if (goodRecord && avg < 3.0) flag = 'low';
    else if (poorRecord && avg >= 4.0) flag = 'high';
    status[m.id] = { mine, doneCount, total: mine.length, hasOverdue, attended, spoke, docCount, quota, speechMin, avg, flag, attendedCount, lateCount, totalMeetings };
  });
  return status;
}

/* ---------------- individual member timeline (used by both roles) ---------------- */
function personalTimeline(id){
  const items = [];
  docs.forEach(d => {
    if (d.who === id) items.push({t:'문서 업로드', label:d.name, meta:d.meta});
    if ((d.co||[]).includes(id)) items.push({t:'문서 공동작업', label:d.name, meta:d.meta});
    d.comments.forEach(c => { if (c.who === id) items.push({t:'문서 댓글', label:`'${d.name}'에 댓글`, meta:c.text}); });
    if (d.pcomments) Object.values(d.pcomments).forEach(list => list.forEach(c => {
      if (c.who === id) items.push({t:'문서 첨삭', label:`'${d.name}' 문단에 메모`, meta:c.text});
    }));
  });
  meetings.forEach(mt => {
    const st = mt.attendance[id];
    if (st) items.push({t:'회의', label:mt.title + (st==='late' ? ' · 지각' : st==='absent' ? ' · 불참' : ' · 참여'), meta:mt.date});
  });
  tasks.forEach(t => { if (t.who === id && t.done) items.push({t:'할 일 완료', label:t.title, meta:t.date}); });
  return items;
}
function screenMemberDetail(id){
  const m = mem(id);
  const items = personalTimeline(id);
  const tl = items.length
    ? items.map(it => `<div class="tlitem"><div class="ttl">${esc(it.t)} · ${esc(it.label)}</div><div class="meta">${esc(it.meta)}</div></div>`).join('')
    : `<div class="empty">기록이 없어요.</div>`;
  const peerHtml = role === 'professor' ? `<section class="card"><h3>동료평가 상세 <span class="muted" style="font-weight:400">· 익명</span></h3>
    ${members.filter(x => x.id !== id).map((ev,i) => {
      const a = peerAnswers[ev.id] && peerAnswers[ev.id][id];
      if (!a) return `<div class="peerrow"><div class="who">학생 ${i+1}</div><div class="scores muted">미제출</div></div>`;
      const scoresTxt = peerQuestions.map(q => `${esc(q.text)} <b>${a.scores[q.id]!=null ? a.scores[q.id]+'/5' : '-'}</b>`).join(' · ');
      return `<div class="peerrow"><div class="who">학생 ${i+1}</div><div class="scores">${scoresTxt}</div>${a.note ? `<div class="note2">"${esc(a.note)}"</div>` : ''}</div>`;
    }).join('')}
    </section>` : '';
  return `<section class="card"><div class="detailhead"><h2><span class="dot" style="background:${m.c}"></span> ${m.name}님의 활동</h2><button class="linklike" data-closemember>← 목록으로</button></div>
    <div class="tl">${tl}</div></section>${peerHtml}`;
}

/* ---------------- APP: 6. 기여기록 (동료평가 평균 노출 안 함) ---------------- */
function timelineEntries(){
  const list = [{type:'doc',id:'d1'},{type:'doc',id:'d2'}];
  meetings.forEach(mt => list.push({type:'meet', id:mt.id}));
  list.push({type:'doc',id:'d3'},{type:'doc',id:'d4'},{type:'doc',id:'d5'},{type:'doc',id:'d6'});
  list.push({type:'task',id:'t6'},{type:'task',id:'t5'});
  return list;
}
function viewRecords(){
  const status = computeStatus();
  const memberCards = members.map(m => {
    const s = status[m.id];
    const pc = s.total ? Math.round(s.doneCount/s.total*100) : 0;
    const meetChip = s.attended === null ? '' : s.attended ? `<span class="chip verified">회의 참여</span>` : `<span class="chip absent">회의 불참</span>`;
    const docChip = s.docCount > 0 ? `<span class="chip verified">문서 제출함</span>` : `<span class="chip absent">문서 미제출</span>`;
    const speechChip = `<span class="chip">🎤 발언 ${s.speechMin}분</span>`;
    return `<div class="mrow">
      <div class="mtop"><button class="mname" data-openmember="${m.id}"><span class="dot" style="background:${m.c}"></span>${m.name}</button><span class="pct">${s.total}개 중 ${s.doneCount}개 완료</span></div>
      <div class="bar"><i style="width:${pc}%;background:${m.c}"></i></div>
      <div class="srcbreak">${meetChip}${docChip}${speechChip}</div>
    </div>`;
  }).join('');

  const tlHtml = timelineEntries().map(e => {
    if (e.type === 'doc'){ const d = docs.find(x=>x.id===e.id); const m = mem(d.who);
      return `<div class="tlitem"><div class="ttl"><span class="dot" style="background:${m.c}"></span> ${m.name}님이 '${esc(d.name)}'을 업로드했어요${d.comments.length?` · 댓글 ${d.comments.length}개`:''}</div><div class="meta">${d.meta}</div></div>`; }
    if (e.type === 'task'){ const t = tasks.find(x=>x.id===e.id); const m = mem(t.who);
      return `<div class="tlitem"><div class="ttl"><span class="dot" style="background:${m.c}"></span> ${m.name}님이 '${esc(t.title)}'을 완료했어요</div><div class="meta">${t.date}</div></div>`; }
    const mt = meetings.find(x=>x.id===e.id);
    return `<div class="tlitem"><div class="ttl">${esc(mt.title)} 진행됨</div><div class="meta">${mt.date}</div></div>`;
  }).join('');

  return `
  <div class="note"><b>왜 %가 아니라 완료 개수인가요.</b> 맡은 역할이 다른데 활동량을 그대로 비교하는 건 공정하지 않아요. "얼마나 많이 했는가" 대신 "맡은 일을 했는가"만 봐요.</div>
  <section class="card"><h3>팀원별 현황</h3>${memberCards}</section>
  <section class="card"><h3>활동 타임라인 <span class="muted" style="font-weight:400">· 증빙 기록</span></h3><div class="tl">${tlHtml}</div></section>`;
}

/* ---------------- professor dashboard ---------------- */
function viewProfessor(){
  const status = computeStatus();
  const od = overdueTask(); const nd = nextDue();
  const flagCount = Object.values(status).filter(s => s.flag).length;
  return `
  <section class="card banner"><div class="top2"><div>
    <div class="eyebrow">${projMeta.course} · ${projMeta.team} · ${esc(projMeta.title)}</div>
    <h1>${od ? '기한이 지난 할 일이 있어요' : nd ? `다음 마감 · ${esc(nd.title)}` : '모든 할 일 완료'}</h1>
    <div class="sub3">완료 여부·회의 참여 같은 최소 기준만 확인해요 — 활동량을 서열화하지 않아요</div>
    </div>${od ? `<span class="dday">기한 초과</span>` : nd ? `<span class="dday">${nd.dday}</span>` : ''}</div>
  </section>
  ${flagCount ? `<div class="note warn"><b>참고.</b> 기록과 동료평가가 크게 엇갈리는 팀원이 ${flagCount}명 있어요. 아래 표의 ⚠️ 를 확인하거나 <button class="linklike" data-tab="peerresults">동료평가 결과 보기 →</button></div>` : ''}
  <section class="card">
    <h2>팀원별 요약</h2>
    <p class="small muted" style="margin:0 0 6px">이 화면은 판단을 돕는 참고 자료만 제공해요. 최종 성적은 논프리라이더 밖에서 결정돼요. 이름을 누르면 개인 활동을 자세히 볼 수 있어요. 동료평가는 <button class="linklike" data-tab="peerresults">별도 탭</button>에서 확인해요.</p>
    <table class="ptbl">
      <thead><tr><th>학생</th><th>완료 할일</th><th>문서 제출</th><th>회의</th><th>동료평가</th></tr></thead>
      <tbody>
      ${members.map(m => {
        const s = status[m.id];
        const meetTxt = s.totalMeetings ? `${s.attendedCount}/${s.totalMeetings}${s.lateCount ? ` <span class="mchip late">지각 ${s.lateCount}회</span>` : ''}` : '기록 없음';
        const flagBadge = s.flag ? `<span class="chip absent" title="${s.flag==='low' ? '기록상 성실한데 동료평가가 낮아요' : '기록상 미흡한데 동료평가가 높아요'}">⚠️ ${s.flag==='low'?'저평가 의심':'후한 평가 의심'}</span>` : '';
        return `<tr>
          <td><button class="mname" data-openmember="${m.id}"><span class="dot" style="background:${m.c}"></span> ${m.name}</button>${flagBadge}</td>
          <td>${s.doneCount}/${s.total}${s.hasOverdue?' · <span class="chip absent">기한 초과</span>':''}</td>
          <td>${s.docCount}/${s.quota}</td>
          <td>${meetTxt}</td>
          <td>${s.avg ? s.avg.toFixed(1)+'/5' : '-'}</td>
        </tr>`;
      }).join('')}
      </tbody>
    </table>
  </section>
  <section class="card"><h3>조 활동 타임라인 <span class="muted" style="font-weight:400">· 증빙 기록</span></h3><div class="tl">${timelineEntries().map(e => {
    if (e.type === 'doc'){ const d = docs.find(x=>x.id===e.id); const mm = mem(d.who);
      return `<div class="tlitem"><div class="ttl"><span class="dot" style="background:${mm.c}"></span> ${mm.name}님이 '${esc(d.name)}'을 업로드했어요${d.comments.length?` · 댓글 ${d.comments.length}개`:''}</div><div class="meta">${d.meta}</div></div>`; }
    if (e.type === 'task'){ const t = tasks.find(x=>x.id===e.id); const mm = mem(t.who);
      return `<div class="tlitem"><div class="ttl"><span class="dot" style="background:${mm.c}"></span> ${mm.name}님이 '${esc(t.title)}'을 완료했어요</div><div class="meta">${t.date}</div></div>`; }
    const mt = meetings.find(x=>x.id===e.id);
    return `<div class="tlitem"><div class="ttl">${esc(mt.title)} 진행됨</div><div class="meta">${mt.date}</div></div>`;
  }).join('')}</div></section>`;
}

/* ---------------- render ---------------- */
function render(){
  let html;
  if (stage === 'role'){ html = screenRole(); }
  else if (stage === 'project'){ html = role === 'student' ? screenProjectStudent() : screenProjectProfessor(); }
  else if (stage === 'placeholder'){ html = screenPlaceholder(); }
  else {
    const header = `<header class="top">
      <div class="brand">논프리라이더<span>${projMeta.course} · ${projMeta.team} · ${esc(projMeta.title)} (concept demo)</span></div>
      <div class="headerlinks">
        <span class="small muted">${role === 'student' ? '학생' : '교수'}으로 접속 중</span>
        <button class="linklike" data-back-proj>다른 프로젝트 보기</button>
      </div>
    </header>`;
    const actingBar = role === 'student' ? `<div class="actingbar">지금 나는<div class="actingpills">
      ${members.map(m => `<button class="${actingAs===m.id?'on':''}" data-acting="${m.id}"><span class="dot" style="background:${m.c}"></span>${m.name}</button>`).join('')}
      </div>로 활동 중이에요</div>` : '';
    const tabsHtml = role === 'student'
      ? `<nav class="tabs">${STUDENT_TABS.map(([k,l]) => `<button class="tab ${tab===k?'on':''}" data-tab="${k}">${l}</button>`).join('')}</nav>`
      : `<nav class="tabs">${PROFESSOR_TABS.map(([k,l]) => `<button class="tab ${tab===k?'on':''}" data-tab="${k}">${l}</button>`).join('')}</nav>`;
    let body;
    if (memberDetailId){ body = screenMemberDetail(memberDetailId); }
    else if (role === 'professor'){ body = ({home:viewProfessor, peerbuild:viewPeerBuild, peerresults:viewPeerResults})[tab](); }
    else { body = ({home:viewHome, calendar:viewCalendar, meeting:viewMeeting, docs:viewDocs, peer:viewPeer, records:viewRecords})[tab](); }
    html = `<div class="wrap">${header}${actingBar}${tabsHtml}<main>${body}</main>
      <p class="foot">개념 시연용 화면이에요. 실제 계정에 연결되지 않고, 데이터는 예시예요.<br>${role === 'professor' ? '회의는 내용이 아니라 참여 여부만 집계돼요 (개인정보 보호).' : '회의는 내용이 아니라 참여·발언 여부만 집계돼요 (개인정보 보호).'}</p>
    </div>`;
  }
  $('#root').innerHTML = html;
  paintHighlights();
}

/* ---------------- events ---------------- */
document.addEventListener('click', e => {
  if (e.target.closest('[data-do-login]')){ role = loginRole; stage = 'project'; render(); return; }
  const roleBtn = e.target.closest('[data-enter-role]');
  if (roleBtn){ role = roleBtn.dataset.enterRole; stage = 'project'; render(); return; }

  const loginTab = e.target.closest('[data-logintab]');
  if (loginTab){ loginRole = loginTab.dataset.logintab; render(); return; }

  if (e.target.closest('[data-back-role]')){ stage = 'role'; role = null; profCourseSel = null; memberDetailId = null; docViewerId = null; showNewCourseForm = false; newCourseInvite = null; showJoinForm = false; joinMsg = null; render(); return; }
  if (e.target.closest('[data-back-proj]')){ stage = 'project'; memberDetailId = null; docViewerId = null; render(); return; }

  const selCourse = e.target.closest('[data-selectcourse]');
  if (selCourse){ profCourseSel = selCourse.dataset.selectcourse; newCourseInvite = null; render(); return; }
  if (e.target.closest('[data-back-course]')){ profCourseSel = null; render(); return; }

  if (e.target.closest('[data-newcoursetoggle]')){ showNewCourseForm = !showNewCourseForm; render(); return; }
  const newCourseSubmit = e.target.closest('[data-newcoursesubmit]');
  if (newCourseSubmit){
    const input = document.querySelector('[data-newcourseinput]');
    const name = input && input.value.trim();
    if (name){
      const code = genInviteCode();
      professorCourses.unshift({course: name, teams: [], inviteCode: code});
      newCourseInvite = {course: name, code};
      showNewCourseForm = false;
    }
    render(); return;
  }
  if (e.target.closest('[data-dismissinvite]')){ newCourseInvite = null; render(); return; }

  const copyBtn = e.target.closest('[data-copycode]');
  if (copyBtn){
    const code = copyBtn.dataset.copycode;
    const link = INVITE_LINK_BASE + code;
    if (navigator.clipboard) navigator.clipboard.writeText(link).catch(() => {});
    copiedCode = code; render();
    setTimeout(() => { if (copiedCode === code){ copiedCode = null; render(); } }, 1500);
    return;
  }

  if (e.target.closest('[data-jointoggle]')){ showJoinForm = !showJoinForm; joinMsg = null; render(); return; }
  const joinSubmit = e.target.closest('[data-joinsubmit]');
  if (joinSubmit){
    const input = document.querySelector('[data-joininput]');
    const raw = (input && input.value.trim().toUpperCase()) || '';
    // 코드 입력 → 현재 팀 리스트에 없는 새로운 과목의 새로운 팀을 만들어서 바로 그 방으로 입장
    if (!studentProjects.find(p => p.id === NEW_JOIN_ID)){
      studentProjects.unshift({id:NEW_JOIN_ID, course:NEW_JOIN_COURSE, team:NEW_JOIN_TEAM, title:NEW_JOIN_TITLE, dday:NEW_JOIN_DDAY, active:true, joinedByCode: raw});
    }
    showJoinForm = false; joinMsg = null;
    projMeta = {course:NEW_JOIN_COURSE, team:NEW_JOIN_TEAM, title:NEW_JOIN_TITLE};
    stage = 'app'; tab = 'home'; memberDetailId = null; docViewerId = null;
    render(); return;
  }

  const openProj = e.target.closest('[data-openproj]');
  if (openProj){
    const id = openProj.dataset.openproj;
    if (id === 'p1'){ projMeta = {course:'마케팅원론', team:'4조', title:'브랜드 리포지셔닝 제안서'}; stage = 'app'; tab = 'home'; }
    else if (id === NEW_JOIN_ID){ projMeta = {course:NEW_JOIN_COURSE, team:NEW_JOIN_TEAM, title:NEW_JOIN_TITLE}; stage = 'app'; tab = 'home'; }
    else { stage = 'placeholder'; }
    memberDetailId = null; docViewerId = null; render(); return;
  }

  const tabBtn = e.target.closest('[data-tab]');
  if (tabBtn){ tab = tabBtn.dataset.tab; memberDetailId = null; docViewerId = null; render(); return; }

  const openMemberBtn = e.target.closest('[data-openmember]');
  if (openMemberBtn){ memberDetailId = openMemberBtn.dataset.openmember; render(); return; }
  if (e.target.closest('[data-closemember]')){ memberDetailId = null; render(); return; }

  const openDocBtn = e.target.closest('[data-opendoc]');
  if (openDocBtn){ docViewerId = openDocBtn.dataset.opendoc; pcOpen = null; pendingSel = null; openHl = null; render(); return; }
  if (e.target.closest('[data-closedoc]')){ docViewerId = null; pcOpen = null; pendingSel = null; openHl = null; render(); return; }

  const addHlBtn = e.target.closest('[data-addhl]');
  if (addHlBtn){ if (pendingSel){ pendingSel.adding = true; render(); setTimeout(() => { const i = $('#hlAddInput'); if (i) i.focus(); }, 0); } return; }

  const hlSubmit = e.target.closest('[data-hlsubmit]');
  if (hlSubmit){
    const input = $('#hlAddInput');
    const val = input && input.value.trim();
    if (val && pendingSel){
      const d = docs.find(x => x.id === pendingSel.docId);
      const id = 'h' + Date.now();
      d.hl.push({id, paraIdx: pendingSel.paraIdx, start: pendingSel.start, end: pendingSel.end, who: actingAs, note: val});
      openHl = id;
    }
    pendingSel = null; render(); return;
  }

  const hlOpen = e.target.closest('[data-hlopen]');
  if (hlOpen){ const id = hlOpen.dataset.hlopen; openHl = (openHl === id) ? null : id; pendingSel = null; render(); return; }

  const pcToggle = e.target.closest('[data-pctoggle]');
  if (pcToggle){ const key = pcToggle.dataset.pctoggle; pcOpen = (pcOpen === key) ? null : key; render(); return; }

  const pcSend = e.target.closest('[data-pcsend]');
  if (pcSend){
    const key = pcSend.dataset.pcsend;
    const [docId, paraId] = key.split(':');
    const input = document.querySelector(`[data-pcinput="${key}"]`);
    if (input && input.value.trim()){
      const d = docs.find(x => x.id === docId);
      d.pcomments[paraId].push({who: actingAs, text: input.value.trim()});
      pcOpen = null; render();
    }
    return;
  }

  const actingBtn = e.target.closest('[data-acting]');
  if (actingBtn){ actingAs = actingBtn.dataset.acting; render(); return; }

  const taskCheck = e.target.closest('[data-taskcheck]');
  if (taskCheck){ const t = tasks.find(x => x.id === taskCheck.dataset.taskcheck); if (t) t.done = !t.done; render(); return; }

  const taskV = e.target.closest('[data-taskview]');
  if (taskV){ taskView = taskV.dataset.taskview; render(); return; }
  const docFil = e.target.closest('[data-docfilter]');
  if (docFil){ docFilter = docFil.dataset.docfilter; render(); return; }
  const cmtT = e.target.closest('[data-cmttoggle]');
  if (cmtT){ const id = cmtT.dataset.cmttoggle; openCmts[id] = !openCmts[id]; render(); return; }
  const coT = e.target.closest('[data-cotoggle]');
  if (coT){ const id = coT.dataset.cotoggle; coOpen = (coOpen === id) ? null : id; render(); return; }
  const coA = e.target.closest('[data-coadd]');
  if (coA){ const [id, mid] = coA.dataset.coadd.split(':'); const d = docs.find(x => x.id === id); d.co = d.co || []; if (!d.co.includes(mid)) d.co.push(mid); render(); return; }
  const coR = e.target.closest('[data-coremove]');
  if (coR){ const [id, mid] = coR.dataset.coremove.split(':'); const d = docs.find(x => x.id === id); d.co = (d.co||[]).filter(x => x !== mid); render(); return; }

  if (e.target.closest('#dropzone')){ if (!parsing) { const inp = $('#realFileInput'); if (inp) inp.click(); } return; }
  const cmtSend = e.target.closest('[data-cmtsend]');
  if (cmtSend){
    const id = cmtSend.dataset.cmtsend;
    const input = document.querySelector(`[data-cmtinput="${id}"]`);
    if (input && input.value.trim()){
      const d = docs.find(x => x.id === id);
      d.comments.push({who: actingAs, text: input.value.trim()});
      render();
    }
    return;
  }

  const wtmCell = e.target.closest('[data-wtm]');
  if (wtmCell){
    const [si,di] = wtmCell.dataset.wtm.split('-').map(Number);
    avail[actingAs][si][di] = avail[actingAs][si][di] ? 0 : 1;
    render(); return;
  }

  const startCallBtn = e.target.closest('[data-startcall]');
  if (startCallBtn){
    inCall = true; callSeconds = 0; callMuted = {};
    render();
    if (callTimerRef) clearInterval(callTimerRef);
    callTimerRef = setInterval(() => {
      callSeconds++;
      const el = document.getElementById('callTimer');
      if (el){ const mm = String(Math.floor(callSeconds/60)).padStart(2,'0'), ss = String(callSeconds%60).padStart(2,'0'); el.textContent = `${mm}:${ss}`; }
    }, 1000);
    return;
  }
  const callMicBtn = e.target.closest('[data-callmic]');
  if (callMicBtn){ const id = callMicBtn.dataset.callmic; callMuted[id] = !callMuted[id]; render(); return; }
  const endCallBtn = e.target.closest('[data-endcall]');
  if (endCallBtn){
    if (callTimerRef) clearInterval(callTimerRef);
    inCall = false;
    const mins = Math.max(1, Math.round(callSeconds/60));
    const speech = {}; let left = mins;
    members.forEach((m,i) => { const v = i === members.length-1 ? left : Math.max(0, Math.round(mins/members.length)); speech[m.id] = callMuted[m.id] ? 0 : v; left -= v; });
    const attendance = {}; members.forEach(m => attendance[m.id] = callMuted[m.id] ? 'late' : 'present');
    meetings.push({
      id:'meet'+(meetings.length+1), title:`${meetings.length+1}차 회의`, topic:'주제 미입력',
      date:`9/${TODAY_DATE} · 방금 종료`, duration:`${mins}분`,
      recording:`${meetings.length+1}차_회의_녹음본.m4a`, attendance, speech
    });
    render(); return;
  }
  const playRecBtn = e.target.closest('[data-playrec]');
  if (playRecBtn){ const t = $('#recToast'); if (t) t.classList.add('show'); return; }

  const peerScoreBtn = e.target.closest('[data-peerscore]');
  if (peerScoreBtn){
    const [target, qid, val] = peerScoreBtn.dataset.peerscore.split(':');
    if (!peerAnswers[actingAs]) peerAnswers[actingAs] = {};
    if (!peerAnswers[actingAs][target]) peerAnswers[actingAs][target] = {scores:{}, note:''};
    peerAnswers[actingAs][target].scores[qid] = Number(val);
    render(); return;
  }
  if (e.target.id === 'peerSubmitBtn'){ peerSubmitted[actingAs] = true; const t = $('#peerToast'); if (t) t.classList.add('show'); render(); return; }

  const qDel = e.target.closest('[data-qdel]');
  if (qDel){ if (peerQuestions.length > 1){ peerQuestions = peerQuestions.filter(q => q.id !== qDel.dataset.qdel); render(); } return; }
  if (e.target.id === 'qAddBtn'){
    const input = $('#qNewInput');
    const val = input && input.value.trim();
    if (val){ peerQuestions.push({id:'q'+Date.now(), text:val}); render(); }
    return;
  }
});

document.addEventListener('input', e => {
  if (e.target.dataset && e.target.dataset.peernote){
    const target = e.target.dataset.peernote;
    if (!peerAnswers[actingAs]) peerAnswers[actingAs] = {};
    if (!peerAnswers[actingAs][target]) peerAnswers[actingAs][target] = {scores:{}, note:''};
    peerAnswers[actingAs][target].note = e.target.value;
  }
  if (e.target.dataset && e.target.dataset.qedit){
    const q = peerQuestions.find(x => x.id === e.target.dataset.qedit);
    if (q) q.text = e.target.value;
  }
});
document.addEventListener('submit', e => {
  const loginForm = e.target.closest('[data-loginform]');
  if (loginForm){
    e.preventDefault();
    role = loginRole;
    stage = 'project';
    render();
    return;
  }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.classList && e.target.classList.contains('logininput')){ e.preventDefault(); role = loginRole; stage = 'project'; render(); return; }
  if (e.key === 'Enter' && e.target.dataset && (e.target.dataset.cmtinput || e.target.dataset.pcinput)){
    e.target.nextElementSibling && e.target.nextElementSibling.click();
  }
  if (e.key === 'Enter' && e.target.id === 'hlAddInput'){ e.preventDefault(); const b = document.querySelector('[data-hlsubmit]'); b && b.click(); }
  if (e.key === 'Enter' && e.target.dataset && e.target.dataset.newcourseinput !== undefined){ e.preventDefault(); const b = document.querySelector('[data-newcoursesubmit]'); b && b.click(); }
  if (e.key === 'Enter' && e.target.dataset && e.target.dataset.joininput !== undefined){ e.preventDefault(); const b = document.querySelector('[data-joinsubmit]'); b && b.click(); }
});

render();
