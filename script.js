const $=s=>document.querySelector(s),sleep=ms=>new Promise(r=>setTimeout(r,ms));

/* ===== Pengaturan & penyimpanan ===== */
const DEF={musik:.5,efek:.6,mute:false,biji:7,tembak:true,kec:350,tema:'gelap',v:2,skinPapan:'jati',skinLubang:'cekung',skinBiji:'kelereng',musikMode:'semua',ulang:'semua',musikPilih:[0,1,2,3,4,5,6,7,8,9],kar:[0,1]};
let S={...DEF},lama=null;
try{lama=JSON.parse(localStorage.getItem('congklak'));S={...DEF,...lama}}catch(e){}
if(!Array.isArray(S.kar)||S.kar.length!=2||S.kar.some(k=>!Number.isInteger(k)||k<0||k>7)||S.kar[0]==S.kar[1])S.kar=[0,1];
if(lama&&lama.v!=2)S.tema='gelap'; // pengaturan versi lama ikut memakai tema gelap sebagai bawaan
const simpan=()=>{try{localStorage.setItem('congklak',JSON.stringify(S))}catch(e){}};

/* ===== Daftar skin ===== */
const SKIN={
  skinPapan:[['jati','Kayu jati'],['eboni','Kayu eboni'],['sogan','Batik sogan'],['indigo','Batik indigo'],['bambu','Bambu']],
  skinLubang:[['cekung','Cekung'],['emas','Bingkai emas'],['ukir','Ukiran'],['kotak','Kotak']],
  skinBiji:[['kelereng','Kelereng'],['sawo','Biji sawo'],['saga','Biji saga'],['kerang','Kerang'],['batu','Batu kali']]
};
const KEL=['#e5484d','#3b82f6','#22c55e','#f5b301','#a855f7','#06b6d4'];

/* ===== Musik latar =====
   Lagu daerah (instrumental) dan lagu anak-anak. Letakkan file mp3 di folder audio/ dengan nama yang
   tertulis di daftar di bawah. Lagu yang filenya belum ada otomatis dilewati dan tampil abu-abu di menu,
   jadi cukup tambahkan file-nya kapan saja tanpa mengubah kode.
   Mode "semua": seluruh lagu yang ada diputar berurutan, setelah lagu terakhir kembali ke lagu pertama.
   Mode "pilih": hanya lagu yang dicentang yang diputar, juga berulang dari awal.
   PENTING: lagu baru ditambahkan di AKHIR daftar agar pilihan yang tersimpan tidak bergeser. */
const DAERAH=[
  ['Ampar-Ampar Pisang','ampar-ampar-pisang.mp3'],['Cublak-Cublak Suweng','cublak-cublak-suweng.mp3'],
  ['Lir-Ilir','lir-ilir.mp3'],['Gundul-Gundul Pacul','gundul-pacul.mp3'],
  ['Rasa Sayange','rasa-sayange.mp3'],['Bungong Jeumpa','bungong-jeumpa.mp3'],
  ['Soleram','soleram.mp3'],['Kicir-Kicir','kicir-kicir.mp3'],
  ['Yamko Rambe Yamko','yamko-rambe-yamko.mp3'],['Sajojo','sajojo.mp3']
];
const ANAK=[
  ['Balonku Ada Lima','balonku-ada-lima.mp3'],['Pelangi-Pelangi','pelangi-pelangi.mp3'],
  ['Bintang Kecil','bintang-kecil.mp3'],['Naik Kereta Api','naik-kereta-api.mp3'],
];
const LAGU=[...DAERAH,...ANAK],NDAERAH=DAERAH.length;
const SEMUA=LAGU.map((_,i)=>i);
const ADA={}; // indeks lagu -> true/false setelah file diperiksa (belum diperiksa dianggap ada)
const tersedia=i=>ADA[i]!==false;
if(!['semua','satu','mati'].includes(S.ulang))S.ulang='semua';
S.musikPilih=(Array.isArray(S.musikPilih)?S.musikPilih:SEMUA).filter(i=>SEMUA.includes(i));
const aktif=()=>{
  const dasar=S.musikMode=='pilih'&&S.musikPilih.length?SEMUA.filter(i=>S.musikPilih.includes(i)):SEMUA;
  const ada=dasar.filter(tersedia);return ada.length?ada:dasar;
};
let li=aktif()[0],bgmMulai=false,bgmBerhenti=false,gagal=0;
const bgm=new Audio();
function audio(){bgm.volume=S.musik;bgm.muted=S.mute;$('#mb').textContent=S.mute?'🔇':'🔊'}
/* Pengulangan: "semua" = kembali ke lagu pertama setelah lagu terakhir,
   "satu" = mengulang lagu yang sedang diputar, "mati" = berhenti setelah lagu terakhir. */
function aturLoop(){bgm.loop=S.ulang=='satu'||(S.ulang=='semua'&&aktif().length==1&&aktif()[0]==li)}
function putar(){
  bgmMulai=true;bgmBerhenti=false;
  bgm.src='audio/'+LAGU[li][1];
  aturLoop();
  if(!sfxJalan)bgm.play().catch(()=>{});
  $('#lagu').textContent='Sedang diputar: '+LAGU[li][0];
  if($('#l-musik').classList.contains('aktif'))buatMusik();
}
function lanjut(){const a=aktif();li=a.find(i=>i>li)??a[0];putar()}
function habis(){
  if(S.ulang=='mati'&&!aktif().some(i=>i>li)){ // lagu terakhir selesai, tanpa pengulangan
    bgmBerhenti=true;$('#lagu').textContent='Musik selesai (tanpa pengulangan)';
    if($('#l-musik').classList.contains('aktif'))buatMusik();return;
  }
  lanjut();
}
bgm.addEventListener('ended',habis);
bgm.addEventListener('error',()=>{
  ADA[li]=false;segarkanDaftar();
  if(++gagal<LAGU.length&&SEMUA.some(tersedia))lanjut();
  else $('#lagu').textContent='File musik tidak ditemukan di folder audio/';
});
bgm.addEventListener('playing',()=>gagal=0);

// Periksa file mana saja yang ada di folder audio/ (sekali saat game dibuka)
function periksaLagu(){
  LAGU.forEach((l,i)=>{
    const a=new Audio();a.preload='metadata';
    a.addEventListener('loadedmetadata',()=>{ADA[i]=true;segarkanDaftar()});
    a.addEventListener('error',()=>{ADA[i]=false;segarkanDaftar()});
    a.src='audio/'+l[1];
  });
}
function segarkanDaftar(){ // daftar judul di menu Tentang dan menu Pilih Musik
  const g=(nama,dari,ke)=>{const a=SEMUA.filter(i=>i>=dari&&i<ke&&tersedia(i));return a.length?`<li><b>${nama}</b></li>`+a.map(i=>`<li>${LAGU[i][0]}</li>`).join(''):''};
  $('#daftarLagu').innerHTML=g('Lagu daerah (instrumental)',0,NDAERAH)+g('Lagu anak-anak',NDAERAH,LAGU.length);
  if($('#l-musik').classList.contains('aktif'))buatMusik();
}

function buatMusik(){
  const semua=S.musikMode!='pilih';let h='';
  LAGU.forEach((l,i)=>{
    if(i==0)h+='<li class="judul">Lagu daerah</li>';
    if(i==NDAERAH)h+='<li class="judul">Lagu anak-anak</li>';
    const ada=tersedia(i),main=i==li&&bgmMulai&&!bgmBerhenti;
    h+=`<li class="${main?'main':''}${ada?'':' hilang'}"><label><input type="checkbox" data-i="${i}" ${ada&&(semua||S.musikPilih.includes(i))?'checked':''} ${semua||!ada?'disabled':''}> ${l[0]}${ada?'':' <small>(file belum ada)</small>'}</label><button class="sek" data-putar="${i}" aria-label="Putar ${l[0]}" ${ada?'':'disabled'}>${main?'♪':'▶'}</button></li>`;
  });
  $('#daftarMusik').innerHTML=h;
  document.querySelector(`[name=mm][value=${semua?'semua':'pilih'}]`).checked=true;
  document.querySelector(`[name=ul][value=${S.ulang}]`).checked=true;
  $('#pSemua').disabled=semua;
  $('#pDaerah').disabled=!SEMUA.some(i=>i<NDAERAH&&tersedia(i));
  $('#pAnak').disabled=!SEMUA.some(i=>i>=NDAERAH&&tersedia(i));
}
$('#daftarMusik').addEventListener('change',e=>{
  const c=e.target;if(!c.dataset.i)return;
  const i=+c.dataset.i,p=S.musikPilih.filter(x=>x!=i);
  if(c.checked)p.push(i);
  if(!p.filter(tersedia).length){c.checked=true;return} // minimal satu lagu harus terpilih
  S.musikPilih=p.sort((x,y)=>x-y);simpan();
});
$('#daftarMusik').addEventListener('click',e=>{const t=e.target.closest('[data-putar]');if(t&&!t.disabled){li=+t.dataset.putar;putar()}});
document.querySelectorAll('[name=mm]').forEach(r=>r.addEventListener('change',()=>{S.musikMode=r.value;simpan();buatMusik()}));
document.querySelectorAll('[name=ul]').forEach(r=>r.addEventListener('change',()=>{S.ulang=r.value;simpan();aturLoop();buatMusik()}));
$('#pSemua').onclick=()=>{S.musikPilih=SEMUA.slice();simpan();buatMusik()};
function pilihKelompok(dari,ke){ // putar hanya satu kelompok lagu (daerah atau anak-anak)
  const a=SEMUA.filter(i=>i>=dari&&i<ke&&tersedia(i));if(!a.length)return;
  S.musikMode='pilih';S.musikPilih=a;simpan();
  if(!a.includes(li)){li=a[0];putar()}else{aturLoop();buatMusik()}
}
$('#pDaerah').onclick=()=>pilihKelompok(0,NDAERAH);
$('#pAnak').onclick=()=>pilihKelompok(NDAERAH,LAGU.length);

/* ===== Efek suara =====
   Klik biji memakai nada sintetis. Suara menang dan kalah memakai file di audio/
   (jika file belum ada, dipakai nada sintetis sebagai cadangan). */
let ac;
function bunyi(f=520,d=.08,t=0){
  if(S.efek<=0)return;
  try{ac=ac||new AudioContext();const o=ac.createOscillator(),g=ac.createGain(),w=ac.currentTime+t;
    o.frequency.value=f;g.gain.setValueAtTime(S.efek*.15,w);o.connect(g);g.connect(ac.destination);
    o.start(w);g.gain.exponentialRampToValueAtTime(.0001,w+d);o.stop(w+d)}catch(e){}
}
const SFX={menang:new Audio('audio/menang.mp3'),kalah:new Audio('audio/kalah.mp3')};
const NADA={menang:[523,659,784,1047],kalah:[392,330,262,196]};
let sfxJalan=false,sfxAktif=null,tmrSfx=0;
function selesaiSfx(){ // suara menang/kalah selesai: musik latar dilanjutkan
  clearTimeout(tmrSfx);sfxAktif=null;
  if(!sfxJalan)return;
  sfxJalan=false;if(bgmMulai&&!bgmBerhenti)bgm.play().catch(()=>{});
}
function hentikanSfx(){if(sfxAktif){sfxAktif.pause();sfxAktif.currentTime=0}selesaiSfx()}
function sfx(nama){ // musik latar dijeda selama suara menang/kalah agar tidak tumpang tindih
  if(S.efek<=0)return;
  hentikanSfx();
  const a=SFX[nama];sfxJalan=true;sfxAktif=a;bgm.pause();
  a.volume=S.efek;a.currentTime=0;a.onended=selesaiSfx;
  a.play().catch(()=>{NADA[nama].forEach((f,i)=>bunyi(f,.22,i*.2));sfxAktif=null;tmrSfx=setTimeout(selesaiSfx,1000)});
}

/*LOGIKA-MULAI*/
/* Indeks 0-6: lubang Pemain 1 (bawah, kiri ke kanan), 7: lumbung Pemain 1,
   8-14: lubang Pemain 2/Komputer (atas, kanan ke kiri), 15: lumbung Pemain 2. */
const sisi=(i,p)=>p?(i>=8&&i<15):i<7;
const sm=(b,a)=>{let s=0;for(let i=a;i<a+7;i++)s+=b[i];return s};
const hs=(b,p)=>[0,1,2,3,4,5,6].map(i=>i+(p?8:0)).filter(i=>b[i]>0);
const acak=a=>a[Math.random()*a.length|0];

// ev (opsional) merekam kejadian untuk animasi: ambil, taruh, tembak
function mainkan(b0,p,idx,tembak,ev){
  const b=b0.slice(),own=p?15:7,opp=p?7:15;
  let n=b[idx],pos=idx,extra=false,g=0;
  b[idx]=0;if(ev)ev.push(['ambil',idx,n]);
  while(g++<400){
    while(n>0){pos=(pos+1)%16;if(pos==opp)continue;b[pos]++;n--;if(ev)ev.push(['taruh',pos])}
    if(pos==own){extra=true;break}
    if(b[pos]>1){n=b[pos];b[pos]=0;if(ev)ev.push(['ambil',pos,n]);continue}
    if(tembak&&sisi(pos,p)){const o=14-pos;if(b[o]>0){const m=b[o];b[own]+=m+1;b[o]=0;b[pos]=0;if(ev)ev.push(['tembak',pos,o,own,m])}}
    break;
  }
  return{b,extra};
}
function akhir(b){const s0=sm(b,0),s1=sm(b,8);if(s0&&s1)return false;b[7]+=s0;b[15]+=s1;for(let i=0;i<7;i++)b[i]=b[i+8]=0;return true}

/* ----- Komputer (selalu pemain 2) -----
   Dikalibrasi lewat simulasi pertandingan agar pemain masih bisa menang:
   Mudah  : acak murni.
   Sedang : serakah (mengejar lumbung), 20% memilih acak.
   Sulit  : minimax 3 langkah, 30% memilih acak, dan langkah pembuka selalu acak
            (jalan duluan di congklak sangat menguntungkan jika dimainkan sempurna). */
function mm(b,p,root,d,al,be){
  const s0=sm(b,0),s1=sm(b,8);
  if(!s0||!s1){const t=(b[15]+s1)-(b[7]+s0);return root?t:-t}
  if(d==0)return root?b[15]-b[7]:b[7]-b[15];
  const max=p==root;let best=max?-1e9:1e9;
  for(const h of hs(b,p)){
    const r=mainkan(b,p,h,S.tembak),v=mm(r.b,r.extra?p:1-p,root,d-1,al,be);
    if(max){best=Math.max(best,v);al=Math.max(al,v)}else{best=Math.min(best,v);be=Math.min(be,v)}
    if(al>=be)break;
  }
  return best;
}
const papanAwal=b=>b[7]+b[15]==0&&sm(b,0)==S.biji*7&&sm(b,8)==S.biji*7;
function pilihAI(b,lv){
  const h=hs(b,1);
  if(lv==1||Math.random()<(lv==2?.2:.3)||(lv==3&&papanAwal(b)))return acak(h);
  let best=-1e9,pil=h[0];
  for(const x of h){
    const r=mainkan(b,1,x,S.tembak);
    const v=(lv==2?r.b[15]-b[15]+(r.extra?2:0):mm(r.b,r.extra?1:0,1,2,-1e9,1e9))+Math.random()*.01;
    if(v>best){best=v;pil=x}
  }
  return pil;
}
/*LOGIKA-SELESAI*/

/* ===== Skin ===== */
function seeds(n,tall){
  // posisi tiap biji tetap (tidak bergeser saat jumlah berubah), biji baru menempati ruang berikutnya
  let h='';const cap=tall?45:18,m=Math.min(n,cap);
  for(let k=0;k<m;k++){const a=k*2.4,r=Math.sqrt((k+.5)/cap);
    h+=`<i class="b" style="left:${50+r*(tall?30:36)*Math.cos(a)}%;top:${50+r*(tall?42:36)*Math.sin(a)}%;--r:${(k*47)%180}deg;--c:${KEL[(k*5+3)%6]}"></i>`}
  return h;
}
function pakaiSkin(){
  const d=document.body.dataset;
  d.papan=S.skinPapan;d.lubang=S.skinLubang;d.biji=S.skinBiji;
  document.documentElement.dataset.theme=S.tema;
  $('#prev').innerHTML=[3,5,7].map(n=>`<div class="lub">${seeds(n,false)}<span class="n">${n}</span></div>`).join('');
}
function buatSkin(){
  for(const [kunci,id] of [['skinPapan','#sPapan'],['skinLubang','#sLubang'],['skinBiji','#sBiji']]){
    const el=$(id);el.innerHTML='';
    SKIN[kunci].forEach(([nilai,nama])=>{
      const t=document.createElement('button');
      t.className='sek'+(S[kunci]==nilai?' pilih':'');t.textContent=nama;
      t.onclick=()=>{S[kunci]=nilai;simpan();pakaiSkin();buatSkin()};
      el.append(t);
    });
  }
  pakaiSkin();
}

/* ===== Papan & tampilan ===== */
let G={b:Array(16).fill(0),p:0,mode:'dua',lv:1,sibuk:false,jeda:false,selesai:false,ekstra:false,id:0};
const cel=[],tangan=$('#tangan');
(function(){
  for(let i=0;i<16;i++){
    const c=document.createElement('div');c.className='lub'+(i==7||i==15?' lumbung':'');c.dataset.i=i;
    c.style.gridArea=i==15?'1/1/3/2':i==7?'1/9/3/10':i<7?`2/${2+i}`:`1/${2+(14-i)}`;
    $('#papan').append(c);cel[i]=c;
  }
})();
function render(){
  const b=G.b,cpu=G.mode=='ai',nm=['Pemain 1',cpu?'Komputer':'Pemain 2'],kn=[KARAKTER[S.kar[0]].nama,KARAKTER[S.kar[1]].nama];
  for(let i=0;i<16;i++){
    const bisa=!G.sibuk&&!G.selesai&&!(cpu&&G.p==1)&&i!=7&&i!=15&&sisi(i,G.p)&&b[i]>0;
    if(cel[i]._n!==b[i]){cel[i]._n=b[i];cel[i].innerHTML=seeds(b[i],i==7||i==15)+`<span class="n">${b[i]}</span>`}
    cel[i].classList.toggle('bisa',bisa);
    cel[i].tabIndex=bisa?0:-1;
  }
  $('#nm1').innerHTML=`<span class="pn">${nm[0]} (${kn[0]})</span><span class="ps">Lumbung: ${b[7]}</span>`;
  $('#nm2').innerHTML=`<span class="pn">${nm[1]} (${kn[1]})</span><span class="ps">Lumbung: ${b[15]}</span>`;
  for(const q of [0,1]){const giliranIni=!G.selesai&&G.p==q;$('#kartu'+(q+1)).classList.toggle('giliran',giliranIni);avatar(q).classList.toggle('giliran',giliranIni)}
  $('#info').textContent=G.selesai?'Permainan selesai':(G.ekstra?'Giliran tambahan! ':'')+'Giliran: '+nm[G.p];
}
$('#papan').onclick=e=>{const c=e.target.closest('.lub');if(c&&c.classList.contains('bisa'))jalan(+c.dataset.i)};
$('#papan').onkeydown=e=>{if(e.key=='Enter'||e.key==' '){e.preventDefault();e.target.click()}};
const ovl=h=>{const o=$('#overlay');o.innerHTML=h?'<div class="panel">'+h+'</div>':'';o.style.display=h?'flex':'none'};

/* ===== Animasi: tumpukan biji di "tangan" berpindah, lalu biji dijatuhkan satu per satu ===== */
const tumpuk=tangan.firstElementChild,badge=tangan.lastElementChild;
const posTangan=i=>{tangan.style.left=cel[i].offsetLeft+cel[i].offsetWidth/2+'px';tangan.style.top=cel[i].offsetTop+cel[i].offsetHeight/2+'px'};
const posBiji=k=>[50+((k&3)-1.5)*19+((k*7)%5-2),76-(k>>2)*14-(k&1)*3];
function isiTumpuk(n){ // tumpukan makin besar jika biji banyak, mengecil seiring biji dijatuhkan
  const m=Math.min(n,16);
  while(tumpuk.children.length>m)tumpuk.lastElementChild.remove();
  while(tumpuk.children.length<m){const k=tumpuk.children.length,[x,y]=posBiji(k),i=document.createElement('i');
    i.className='b';i.style.cssText=`left:${x}%;top:${y}%;--r:${(k*47)%180}deg;--c:${KEL[(k*5+3)%6]}`;tumpuk.append(i)}
  tumpuk.style.setProperty('--s',.7+.6*m/16);
  badge.textContent=n>0?n:'';
}
function munculTangan(i,n){ // biji diangkat dari lubang: tumpukan membesar dari kecil
  tangan.style.transition='none';tumpuk.style.transition='none';posTangan(i);isiTumpuk(0);tumpuk.style.setProperty('--s',.3);
  void tangan.offsetWidth;tangan.style.transition='';tumpuk.style.transition='';
  tangan.classList.remove('sembunyi');isiTumpuk(n);
}
async function pindah(i){ // meluncur ke lubang berikutnya sambil sedikit terangkat
  const d=S.kec*.65;tangan.style.transitionDuration=d+'ms';posTangan(i);
  tumpuk.animate?.([{translate:'0 0'},{translate:'0 -14px'},{translate:'0 0'}],{duration:d,easing:'ease-in-out'});
  await sleep(d);
}
function jatuhkan(h,tanpaEfek){ // satu biji jatuh dari tumpukan ke dalam lubang
  const top=tumpuk.lastElementChild,c=cel[h],W=Math.max(10,c.offsetWidth*.16),el=document.createElement('i');
  el.className='b jatuh';
  el.style.cssText=`width:${W}px;left:${c.offsetLeft+c.offsetWidth/2}px;top:${c.offsetTop+c.offsetHeight/2}px;--r:${top?top.style.getPropertyValue('--r'):'0deg'};--c:${top?top.style.getPropertyValue('--c'):KEL[0]}`;
  $('#papan').append(el);
  const a=el.animate?.([{transform:`translate(-50%,calc(-50% - ${Math.round(tangan.offsetHeight*.45)}px)) scale(1.7)`},{transform:'translate(-50%,-50%) scale(1)'}],{duration:S.kec*.4,easing:'cubic-bezier(.5,0,.9,.55)'});
  const id=G.id; // abaikan jika permainan sudah diulang atau ditutup saat biji masih jatuh
  return new Promise(res=>{const fin=()=>{el.remove();if(G.id==id){G.b[h]++;render();efek(h,'pop');bunyi(420+(G.b[h]%8)*35,.06);if(!tanpaEfek&&(h==7||h==15))hadiah(h,1)}res()};a?a.finished.then(fin,fin):fin()});
}
function efek(i,kelas){const c=cel[i];c.classList.remove(kelas);void c.offsetWidth;c.classList.add(kelas)}
async function animasi(ev,id){
  let n=0,tunda=[];
  const ok=async()=>{while(G.jeda)await sleep(100);return G.id==id};
  const tuntas=async()=>{await Promise.all(tunda);tunda=[]}; // tunggu semua biji mendarat
  for(const e of ev){
    if(!await ok())return false;
    if(e[0]=='ambil'){
      await tuntas();G.b[e[1]]=0;n=e[2];render();
      if(tangan.classList.contains('sembunyi'))munculTangan(e[1],n);else isiTumpuk(n);
      bunyi(300,.05);await sleep(S.kec*.45);
    }else if(e[0]=='taruh'){
      await pindah(e[1]);
      if(!await ok())return false;
      n--;isiTumpuk(n);tunda.push(jatuhkan(e[1]));await sleep(S.kec*.25);
    }else{ // tembak: ambil biji lubang seberang, bawa ke lumbung
      const [,pos,o,own,m]=e,pm=G.p;
      await tuntas();G.b[pos]=0;render();isiTumpuk(1);efek(o,'kena');bunyi(220,.15);
      bicara(pm,acak(['Dor! Kena!','Tembak!','Kena kamu!']));ekspresi(pm,'senang',1600);ekspresi(1-pm,'kaget',1300);lompat(pm);percik(o,10);
      await sleep(S.kec*.5);
      await pindah(o);G.b[o]=0;render();n=1+m;isiTumpuk(n);bunyi(260,.12);await sleep(S.kec*.35);
      await pindah(own);
      for(let j=n-1;j>=0;j--){if(!await ok())return false;isiTumpuk(j);tunda.push(jatuhkan(own,true));await sleep(Math.max(45,S.kec*.1))}
      await tuntas();if(G.id==id)hadiah(own,m+1,true);
    }
  }
  await tuntas();tangan.classList.add('sembunyi');isiTumpuk(0);
  return G.id==id;
}

/* ===== Maskot, percikan, dan konfeti ===== */
const KANCIL_SVG='<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M14 100C14 80 30 74 50 74S86 80 86 100Z" fill="#c98a4b"/><path d="M38 100C38 88 44 82 50 82S62 88 62 100Z" fill="#f6e3c2"/><ellipse cx="22" cy="30" rx="9" ry="17" transform="rotate(-24 22 30)" fill="#d9a066"/><ellipse cx="22" cy="31" rx="4.5" ry="11" transform="rotate(-24 22 31)" fill="#f3a9a4"/><ellipse cx="78" cy="30" rx="9" ry="17" transform="rotate(24 78 30)" fill="#d9a066"/><ellipse cx="78" cy="31" rx="4.5" ry="11" transform="rotate(24 78 31)" fill="#f3a9a4"/><ellipse cx="50" cy="52" rx="27" ry="25" fill="#e3ae72"/><circle cx="40" cy="33" r="2.3" fill="#fff7e6"/><circle cx="50" cy="29.5" r="2.3" fill="#fff7e6"/><circle cx="60" cy="33" r="2.3" fill="#fff7e6"/><ellipse cx="50" cy="63" rx="15" ry="11" fill="#f8e5c3"/><ellipse cx="50" cy="58" rx="4.4" ry="3.2" fill="#4a2a17"/><circle cx="31" cy="60" r="5" fill="#f58f8a" opacity=".55"/><circle cx="69" cy="60" r="5" fill="#f58f8a" opacity=".55"/><g class="mata-n kedip"><circle cx="38" cy="47" r="6.2" fill="#fff"/><circle cx="62" cy="47" r="6.2" fill="#fff"/><circle cx="39" cy="48" r="3.7" fill="#2b1a10"/><circle cx="61" cy="48" r="3.7" fill="#2b1a10"/><circle cx="40.3" cy="46.4" r="1.25" fill="#fff"/><circle cx="62.3" cy="46.4" r="1.25" fill="#fff"/></g><g class="mata-s" fill="none" stroke="#2b1a10" stroke-width="2.8" stroke-linecap="round"><path d="M32 49Q38 41 44 49"/><path d="M56 49Q62 41 68 49"/></g><g stroke="#4a2a17" stroke-width="2.4" stroke-linecap="round" fill="none"><path d="M50 61V66"/><path class="mt-n" d="M43 66Q50 72 57 66"/><path class="mt-d" d="M43 71Q50 65 57 71"/></g><path class="mt-s" d="M42 65Q50 79 58 65Z" fill="#c2404b" stroke="#4a2a17" stroke-width="2" stroke-linejoin="round"/><ellipse class="mt-o" cx="50" cy="69" rx="3.6" ry="4.6" fill="#7a2a33"/></svg>';
const ORANG_SVG='<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M10 100C10 80 28 74 50 74S90 80 90 100Z" fill="#d9701f"/><circle cx="19" cy="52" r="8" fill="#d9701f"/><circle cx="19" cy="52" r="4" fill="#f2b184"/><circle cx="81" cy="52" r="8" fill="#d9701f"/><circle cx="81" cy="52" r="4" fill="#f2b184"/><ellipse cx="50" cy="46" rx="31" ry="27" fill="#e8822b"/><circle cx="35" cy="24" r="9" fill="#e8822b"/><circle cx="50" cy="19" r="10" fill="#e8822b"/><circle cx="65" cy="24" r="9" fill="#e8822b"/><ellipse cx="50" cy="55" rx="22" ry="23" fill="#f6c79a"/><ellipse cx="50" cy="66" rx="13" ry="9.5" fill="#fbdcb9"/><ellipse cx="46.5" cy="62" rx="1.5" ry="1.2" fill="#7a3d1c"/><ellipse cx="53.5" cy="62" rx="1.5" ry="1.2" fill="#7a3d1c"/><circle cx="33" cy="62" r="4.5" fill="#f58f8a" opacity=".5"/><circle cx="67" cy="62" r="4.5" fill="#f58f8a" opacity=".5"/><g class="mata-n kedip"><circle cx="41" cy="51" r="4" fill="#2b1a10"/><circle cx="59" cy="51" r="4" fill="#2b1a10"/><circle cx="42.2" cy="49.6" r="1.3" fill="#fff"/><circle cx="60.2" cy="49.6" r="1.3" fill="#fff"/></g><g class="mata-s" fill="none" stroke="#2b1a10" stroke-width="2.8" stroke-linecap="round"><path d="M35 53Q41 45 47 53"/><path d="M53 53Q59 45 65 53"/></g><g stroke="#6b2f12" stroke-width="2.4" stroke-linecap="round" fill="none"><path class="mt-n" d="M44 70Q50 75 56 70"/><path class="mt-d" d="M44 74Q50 68 56 74"/></g><path class="mt-s" d="M43 69Q50 82 57 69Z" fill="#c2404b" stroke="#6b2f12" stroke-width="2" stroke-linejoin="round"/><ellipse class="mt-o" cx="50" cy="72" rx="3.4" ry="4.4" fill="#7a2a33"/></svg>';
function wajahSvg(w){ // wajah dengan 4 ekspresi: biasa, senang, sedih, kaget (diganti lewat kelas CSS)
  const ex=w.ex||12,ey=w.ey||48,er=w.er||4.5,my=w.my||66,tn=w.tn||'#2b1a10',mk=w.mk||'#4a2a17',L=50-ex,R=50+ex;
  return `<g class="mata-n kedip"><circle cx="${L}" cy="${ey}" r="${er+1.6}" fill="#fff"/><circle cx="${R}" cy="${ey}" r="${er+1.6}" fill="#fff"/><circle cx="${L+.8}" cy="${ey+.8}" r="${er}" fill="${tn}"/><circle cx="${R-.8}" cy="${ey+.8}" r="${er}" fill="${tn}"/><circle cx="${L+1.8}" cy="${ey-.8}" r="1.3" fill="#fff"/><circle cx="${R-.2}" cy="${ey-.8}" r="1.3" fill="#fff"/></g>`
  +`<g class="mata-s" fill="none" stroke="${tn}" stroke-width="2.8" stroke-linecap="round"><path d="M${L-6} ${ey+2}Q${L} ${ey-6} ${L+6} ${ey+2}"/><path d="M${R-6} ${ey+2}Q${R} ${ey-6} ${R+6} ${ey+2}"/></g>`
  +`<g stroke="${mk}" stroke-width="2.4" stroke-linecap="round" fill="none"><path class="mt-n" d="M43 ${my}Q50 ${my+6} 57 ${my}"/><path class="mt-d" d="M43 ${my+5}Q50 ${my-1} 57 ${my+5}"/></g>`
  +`<path class="mt-s" d="M42 ${my-1}Q50 ${my+13} 58 ${my-1}Z" fill="#c2404b" stroke="${mk}" stroke-width="2" stroke-linejoin="round"/><ellipse class="mt-o" cx="50" cy="${my+3}" rx="3.6" ry="4.6" fill="#7a2a33"/>`;
}
const badan=(c,d)=>`<path d="M14 100C14 80 30 74 50 74S86 80 86 100Z" fill="${c}"/>${d||''}`;
const pipi='<circle cx="30" cy="60" r="5" fill="#f58f8a" opacity=".5"/><circle cx="70" cy="60" r="5" fill="#f58f8a" opacity=".5"/>';
function rakit(c){return `<svg viewBox="0 0 100 100" aria-hidden="true">${c.belakang||''}${badan(c.badan,c.dada)}${c.kepala}${c.tengah||''}${wajahSvg(c.wajah)}${c.depan||''}</svg>`}
const DAFTAR=[
  {nama:'Kancil',suara:'Ayo main, aku Kancil!',svg:'__KANCIL__'},
  {nama:'Orangutan',suara:'Uhuu, ayo main!',svg:'__ORANG__'},
  {nama:'Kucing',suara:'Meong! Ayo main!',badan:'#8d8da0',
    belakang:'<path d="M22 44L26 14L46 30Z" fill="#a9a9bc"/><path d="M78 44L74 14L54 30Z" fill="#a9a9bc"/><path d="M27 36L28 22L38 30Z" fill="#f3a9a4"/><path d="M73 36L72 22L62 30Z" fill="#f3a9a4"/>',
    kepala:'<ellipse cx="50" cy="52" rx="29" ry="25" fill="#b9b9cb"/><path d="M50 28V35M42 29L43 35M58 29L57 35" stroke="#8d8da0" stroke-width="2.6" stroke-linecap="round"/><ellipse cx="50" cy="62" rx="13" ry="9" fill="#ecebf3"/><path d="M46.5 57.5h7L50 62Z" fill="#f08a96"/>'+pipi,
    depan:'<g stroke="#6d6d82" stroke-width="1.4" stroke-linecap="round"><path d="M36 64L19 61M36 67L20 69M64 64L81 61M64 67L80 69"/></g>',
    wajah:{ex:12,ey:48,er:4.8,my:66,mk:'#5a4a5e'}},
  {nama:'Harimau',suara:'Auum! Ayo main!',badan:'#e08a1f',
    belakang:'<circle cx="24" cy="32" r="10" fill="#f0a331"/><circle cx="76" cy="32" r="10" fill="#f0a331"/><circle cx="24" cy="33" r="5" fill="#fbe3b8"/><circle cx="76" cy="33" r="5" fill="#fbe3b8"/>',
    dada:'<path d="M26 82l9 4M74 82l-9 4M22 92l10 2M78 92l-10 2" stroke="#6a3a0c" stroke-width="3" stroke-linecap="round"/>',
    kepala:'<ellipse cx="50" cy="52" rx="30" ry="25" fill="#f2a93b"/><path d="M50 27V37M40 28L42 36M60 28L58 36M21 48L30 50M20 58L29 57M79 48L70 50M80 58L71 57" stroke="#6a3a0c" stroke-width="3.2" stroke-linecap="round"/><ellipse cx="50" cy="63" rx="15" ry="11" fill="#fff4de"/><path d="M45.5 56.5h9L50 62Z" fill="#4a2a17"/>'+pipi,
    wajah:{ex:13,ey:47,er:4.4,my:67,mk:'#4a2a17'}},
  {nama:'Gajah',suara:'Tuut! Ayo main!',badan:'#7f98b0',
    belakang:'<ellipse cx="17" cy="52" rx="15" ry="19" fill="#8aa3bb"/><ellipse cx="83" cy="52" rx="15" ry="19" fill="#8aa3bb"/><ellipse cx="18" cy="53" rx="8" ry="13" fill="#f0b4b4"/><ellipse cx="82" cy="53" rx="8" ry="13" fill="#f0b4b4"/>',
    kepala:'<ellipse cx="50" cy="50" rx="27" ry="26" fill="#9db4ca"/><path d="M42 58Q42 74 50 76Q58 74 58 58Z" fill="#9db4ca" stroke="#7f98b0" stroke-width="2"/><path d="M45 64h10M45 69h10" stroke="#7f98b0" stroke-width="1.6" stroke-linecap="round"/>'+pipi.replace('cy="60"','cy="56"').replace('cy="60"','cy="56"'),
    wajah:{ex:15,ey:44,er:4.2,my:80,mk:'#4f6277'}},
  {nama:'Kelinci',suara:'Hop hop! Ayo main!',badan:'#d9cdbf',
    belakang:'<ellipse cx="38" cy="18" rx="8" ry="20" fill="#f3ece3"/><ellipse cx="62" cy="18" rx="8" ry="20" fill="#f3ece3"/><ellipse cx="38" cy="19" rx="3.8" ry="14" fill="#f3b5b8"/><ellipse cx="62" cy="19" rx="3.8" ry="14" fill="#f3b5b8"/>',
    kepala:'<ellipse cx="50" cy="55" rx="27" ry="23" fill="#f8f2ea"/><ellipse cx="50" cy="64" rx="11" ry="8" fill="#fff"/><path d="M46.5 59h7L50 63Z" fill="#ef8a9a"/>'+pipi.replace('cy="60"','cy="61"').replace('cy="60"','cy="61"'),
    depan:'<rect x="46.5" y="68" width="3.2" height="5" rx="1" fill="#fff" stroke="#c9bcae" stroke-width=".8"/><rect x="50.3" y="68" width="3.2" height="5" rx="1" fill="#fff" stroke="#c9bcae" stroke-width=".8"/>',
    wajah:{ex:13,ey:51,er:4.4,my:66,mk:'#7a5a5a'}},
  {nama:'Katak',suara:'Kwek kwek! Ayo main!',badan:'#4f9d4a',
    belakang:'<circle cx="31" cy="34" r="12" fill="#6cbb5f"/><circle cx="69" cy="34" r="12" fill="#6cbb5f"/>',
    kepala:'<ellipse cx="50" cy="56" rx="33" ry="22" fill="#74c466"/><ellipse cx="50" cy="66" rx="22" ry="11" fill="#b9e3a6"/><circle cx="46" cy="55" r="1.4" fill="#2f6a2b"/><circle cx="54" cy="55" r="1.4" fill="#2f6a2b"/><circle cx="25" cy="60" r="4.6" fill="#f58f8a" opacity=".55"/><circle cx="75" cy="60" r="4.6" fill="#f58f8a" opacity=".55"/><circle cx="37" cy="48" r="1.5" fill="#4f9d4a" opacity=".6"/><circle cx="65" cy="45" r="1.5" fill="#4f9d4a" opacity=".6"/>',
    wajah:{ex:19,ey:34,er:5,my:63,mk:'#2f6a2b'}},
  {nama:'Anak Batik',suara:'Halo, ayo main congklak!',badan:'#a8431f',
    dada:'<path d="M38 76L50 90L62 76" fill="none" stroke="#f0c36a" stroke-width="2.4"/><circle cx="50" cy="95" r="3" fill="#f0c36a"/><circle cx="30" cy="92" r="2.4" fill="#f0c36a"/><circle cx="70" cy="92" r="2.4" fill="#f0c36a"/>',
    belakang:'<circle cx="26" cy="28" r="11" fill="#2a1a14"/><circle cx="74" cy="28" r="11" fill="#2a1a14"/>',
    kepala:'<ellipse cx="50" cy="54" rx="26" ry="25" fill="#e9b88a"/><path d="M23 50C22 28 36 22 50 22S78 28 77 50C70 40 62 36 50 36S30 40 23 50Z" fill="#2a1a14"/><circle cx="26" cy="27" r="3" fill="#f2b5c5"/><circle cx="74" cy="27" r="3" fill="#f2b5c5"/><circle cx="50" cy="60" r="1.6" fill="#b87a52"/>'+pipi,
    wajah:{ex:11,ey:52,er:4.2,my:68,mk:'#7a3d2a'}}
];
DAFTAR[0].svg=KANCIL_SVG;DAFTAR[1].svg=ORANG_SVG;
const KARAKTER=DAFTAR.map(c=>({nama:c.nama,suara:c.suara,svg:c.svg||rakit(c)}));
const nKar=KARAKTER.length;
const maskotHtml=(p,k)=>`<div class="maskot besar ${k}">${KARAKTER[S.kar[p]].svg}</div>`;
const avatar=p=>$('#av'+(p+1));
function pasangMaskot(){$('#av1').innerHTML=KARAKTER[S.kar[0]].svg;$('#av2').innerHTML=KARAKTER[S.kar[1]].svg}
function buatKarakter(){
  for(const p of [0,1])$('#kar'+(p+1)).innerHTML=KARAKTER.map((c,k)=>`<button type="button" class="kar${S.kar[p]==k?' pilih':''}" data-kar="${p}:${k}" aria-pressed="${S.kar[p]==k}"><div class="maskot kecil">${c.svg}</div><span>${c.nama}</span></button>`).join('');
}
function ekspresi(p,kelas,ms){ // kelas: senang | sedih | kaget (kosong = wajah biasa)
  const m=avatar(p);m.classList.remove('senang','sedih','kaget');clearTimeout(m._t);
  if(kelas){m.classList.add(kelas);if(ms)m._t=setTimeout(()=>m.classList.remove(kelas),ms)}
}
function bicara(p,teks,ms=1900){
  const g=$('#gl'+(p+1));g.textContent=teks;g.classList.add('tampil');
  clearTimeout(g._t);g._t=setTimeout(()=>g.classList.remove('tampil'),ms);
}
function lompat(p){const sv=avatar(p).firstElementChild;if(!sv)return;sv.classList.remove('lompat');void sv.getBoundingClientRect();sv.classList.add('lompat')}
function percik(i,n=8){ // percikan bintang di sekitar lubang
  const c=cel[i],x=c.offsetLeft+c.offsetWidth/2,y=c.offsetTop+c.offsetHeight/2,R=c.classList.contains('lumbung')?55:36,pa=$('#papan');
  for(let k=0;k<n;k++){
    const a=Math.PI*2*k/n+Math.random()*.5,d=R*.6+Math.random()*R,e=document.createElement('i');
    e.className='pcr';e.style.cssText=`left:${x}px;top:${y}px;--dx:${Math.cos(a)*d}px;--dy:${Math.sin(a)*d}px;--c:${KEL[k%6]}`;
    pa.append(e);setTimeout(()=>e.remove(),950);
  }
}
function skor(i,n,besar){ // angka "+N" melayang dari lumbung
  const c=cel[i],e=document.createElement('b');
  e.className='skor'+(besar?' besar':'');e.textContent='+'+n;
  e.style.cssText=`left:${c.offsetLeft+c.offsetWidth/2}px;top:${c.offsetTop+c.offsetHeight*(besar?.5:.4)}px`;
  $('#papan').append(e);setTimeout(()=>e.remove(),1200);
}
function hadiah(i,n,besar){ // biji masuk lumbung (besar = hasil tembakan)
  percik(i,besar?14:6);skor(i,n,besar);
  const q=i==15?1:0;ekspresi(q,'senang',besar?1500:700);if(besar)lompat(q);
}
function konfeti(){
  const w=['#e5484d','#3b82f6','#22c55e','#f5b301','#a855f7','#06b6d4','#ff8fb1'];
  $('#konfeti').innerHTML=Array.from({length:80},(_,k)=>{
    const lebar=6+Math.random()*7;
    return `<i style="left:${(Math.random()*100).toFixed(1)}%;--c:${w[k%w.length]};--w:${lebar.toFixed(1)}px;--h:${(lebar*(Math.random()<.5?1:2.2)).toFixed(1)}px;--r:${Math.random()<.4?'50%':'2px'};--d:${(2.8+Math.random()*2).toFixed(1)}s;--t:${(Math.random()*1.4).toFixed(2)}s;--x:${(Math.random()*160-80).toFixed(0)}px;--rot:${(360+Math.random()*720).toFixed(0)}deg"></i>`;
  }).join('');
  setTimeout(()=>{$('#konfeti').innerHTML=''},6500);
}
function bersihkanEfek(){
  $('#konfeti').innerHTML='';
  for(const q of [0,1]){ekspresi(q);$('#gl'+(q+1)).classList.remove('tampil');avatar(q).classList.remove('menari','giliran')}
}
/* Latar: bintang dan kunang-kunang diletakkan acak tetap (posisinya sama setiap kali dibuka) */
function buatLatar(){
  let r=7;const rnd=()=>(r=(r*9301+49297)%233280)/233280;
  $('#bintang').innerHTML=Array.from({length:42},()=>`<i class="bintang" style="left:${(rnd()*100).toFixed(1)}%;top:${(rnd()*52).toFixed(1)}%;--u:${(1.5+rnd()*2.5).toFixed(1)}px;--d:${(2.5+rnd()*3).toFixed(1)}s;--t:-${(rnd()*5).toFixed(1)}s"></i>`).join('');
  $('#kunang').innerHTML=Array.from({length:16},()=>`<i class="kunang" style="left:${(rnd()*100).toFixed(1)}%;top:${(62+rnd()*30).toFixed(1)}%;--x:${(rnd()*120-60).toFixed(0)}px;--y:${(rnd()*90-60).toFixed(0)}px;--d:${(5+rnd()*6).toFixed(1)}s;--t:-${(rnd()*8).toFixed(1)}s"></i>`).join('');
}

/* ===== Alur permainan ===== */
function mulai(mode,lv){
  hentikanSfx();
  G={b:Array(16).fill(S.biji),p:0,mode,lv,sibuk:false,jeda:false,selesai:false,ekstra:false,id:Date.now()};
  G.b[7]=G.b[15]=0;
  if(mode=='ai'){const d=document.querySelector('[name=dl]:checked').value;G.p=d=='komputer'?1:d=='acak'?(Math.random()<.5?0:1):0}
  tangan.classList.add('sembunyi');ovl('');bersihkanEfek();tampil('game');giliran();
  const id0=G.id;
  setTimeout(()=>{if(G.id==id0&&!G.selesai)bicara(0,KARAKTER[S.kar[0]].suara)},500);
  setTimeout(()=>{if(G.id==id0&&!G.selesai)bicara(1,KARAKTER[S.kar[1]].suara)},1300);
}
function giliran(){
  if(G.selesai)return;
  if(G.mode=='ai'&&G.p==1){G.sibuk=true;const id=G.id;setTimeout(()=>{if(G.id==id&&!G.selesai)jalan(pilihAI(G.b,G.lv))},600)}
  else G.sibuk=false;
  render();
}
async function jalan(h){
  G.sibuk=true;G.ekstra=false;const id=G.id,ev=[],r=mainkan(G.b,G.p,h,S.tembak,ev);render();
  const ok=await animasi(ev,id);
  if(!ok||G.id!=id)return;
  G.b=r.b;
  if(akhir(G.b)){selesai();return}
  G.ekstra=r.extra;if(!r.extra)G.p=1-G.p;
  bunyi(r.extra?880:300,.15);
  if(r.extra){bicara(G.p,acak(['Yey, jalan lagi!','Asyik, giliran lagi!','Hore, lagi!']));ekspresi(G.p,'senang',1400);lompat(G.p)}
  giliran();
}
function selesai(){
  G.selesai=true;render();
  const a=G.b[7],c=G.b[15],cpu=G.mode=='ai',nm=['Pemain 1',cpu?'Komputer':'Pemain 2'],menang=a==c?-1:(a>c?0:1);
  let judul='Seri!',sapa='Sama kuat, hebat!',gambar=maskotHtml(0,'senang')+maskotHtml(1,'senang');
  if(menang>=0){
    judul=cpu?(menang==0?'Kamu menang!':'Komputer menang'):nm[menang]+' menang!';
    // Suara menang: lawan komputer maupun 1 vs 1. Suara kalah: hanya lawan komputer.
    if(cpu)sfx(menang==0?'menang':'kalah');else sfx('menang');
    if(cpu&&menang==1){sapa='Jangan menyerah, ayo coba lagi!';gambar=maskotHtml(0,'sedih')}
    else{sapa=cpu?'Hebat sekali!':'Selamat!';gambar=maskotHtml(menang,'senang menari');konfeti()}
  }
  ovl(`<div class="juara">${gambar}</div><h2>${judul}</h2><p>${sapa}<br>${nm[0]}: ${a} biji<br>${nm[1]}: ${c} biji</p><button data-aksi="ulang">Main lagi</button><button class="sek" data-aksi="menu">Menu utama</button>`);
}
let dariGame=false;
const bukaJeda=()=>{G.jeda=true;ovl('<h2>Jeda</h2><button data-aksi="lanjut">Lanjut</button><button data-aksi="atur">Pengaturan</button><button data-aksi="karakter">Karakter</button><button data-aksi="ulang">Ulang permainan</button><button class="sek" data-aksi="menu">Menu utama</button>')};
$('#bJeda').onclick=bukaJeda;

/* ===== Navigasi ===== */
function tampil(id){
  document.querySelectorAll('.layar').forEach(s=>s.classList.toggle('aktif',s.id=='l-'+id));
  document.body.classList.toggle('dimain',id=='game'); // latar bergambar hanya saat bermain
  if(id=='skin')buatSkin();if(id=='atur')ui();if(id=='musik')buatMusik();if(id=='karakter')buatKarakter();
}
document.addEventListener('click',e=>{
  if(!bgmMulai)putar();
  const k=e.target.closest('[data-ke]');if(k){tampil(k.dataset.ke);return}
  const l=e.target.closest('[data-lv]');if(l){mulai('ai',+l.dataset.lv);return}
  const a=e.target.closest('[data-aksi]');if(!a)return;
  const x=a.dataset.aksi;
  if(x=='dua')mulai('dua',0);
  if(x=='ulang')mulai(G.mode,G.lv);
  if(x=='lanjut'){G.jeda=false;ovl('')}
  if(x=='atur'){dariGame=true;ovl('');tampil('atur')} // permainan tetap dijeda
  if(x=='karakter'){dariGame=true;ovl('');tampil('karakter')}
  if(x=='menu'){if(!G.selesai&&!confirm('Keluar ke menu utama? Permainan yang sedang berjalan akan hilang.'))return;hentikanSfx();G.id=0;G.jeda=false;dariGame=false;ovl('');bersihkanEfek();tampil('menu')}
});

/* ===== Pengaturan ===== */
function ui(){
  $('#vm').value=S.musik*100;$('#ve').value=S.efek*100;$('#mu').checked=S.mute;
  $('#bi').value=S.biji;$('#te').checked=S.tembak;$('#ke').value=S.kec;$('#th').value=S.tema;
}
const ubah=(id,fn)=>$(id).addEventListener('input',e=>{fn(e.target);simpan();audio();pakaiSkin()});
ubah('#vm',t=>S.musik=t.value/100);ubah('#ve',t=>S.efek=t.value/100);ubah('#mu',t=>S.mute=t.checked);
ubah('#bi',t=>S.biji=+t.value);ubah('#te',t=>S.tembak=t.checked);ubah('#ke',t=>S.kec=+t.value);ubah('#th',t=>S.tema=t.value);
$('#lewati').onclick=lanjut;
$('#kbAtur').onclick=()=>{if(dariGame){dariGame=false;tampil('game');bukaJeda()}else tampil('menu')};
$('#kbKar').onclick=()=>{if(dariGame){dariGame=false;tampil('game');render();bukaJeda()}else tampil('menu')};
document.addEventListener('click',e=>{const t=e.target.closest('[data-kar]');if(!t)return;
  const [p,k]=t.dataset.kar.split(':').map(Number),a=S.kar.slice();
  if(a[1-p]==k)a[1-p]=a[p]; // jika sama dengan karakter lawan, keduanya bertukar
  a[p]=k;S.kar=a;simpan();pasangMaskot();buatKarakter();render()});
$('#mb').onclick=()=>{S.mute=!S.mute;simpan();audio();ui()};
$('#reset').onclick=()=>{S={...DEF,kar:[0,1]};simpan();audio();pakaiSkin();pasangMaskot();render();ui()};

function heroPapan(){
  const t=(cx,cy,rx,ry,n)=>{let o=`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="var(--lubang)"/>`;
    for(let k=0;k<n;k++){const a=k*2.4,r=Math.sqrt((k+.5)/n);o+=`<circle cx="${cx+r*(rx-7)*Math.cos(a)}" cy="${cy+r*(ry-7)*Math.sin(a)}" r="4.5" fill="${KEL[(k*5+3)%6]}"/>`}return o};
  let o='<rect x="3" y="12" width="414" height="126" rx="58" fill="#8b5a2b" stroke="#e0a526" stroke-width="3"/>'+t(38,75,24,50,12)+t(382,75,24,50,16);
  for(let i=0;i<7;i++){const x=92+i*39.3;o+=t(x,48,17,17,7)+t(x,102,17,17,7)}
  $('#hero').innerHTML=o;
}
audio();pakaiSkin();heroPapan();pasangMaskot();buatLatar();segarkanDaftar();periksaLagu();render();
