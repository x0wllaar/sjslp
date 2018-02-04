function dec2hex (dec) {
  return ('0' + dec.toString(16)).substr(-2)
}

function generateId (len) {
  var arr = new Uint8Array((len || 40) / 2)
  window.crypto.getRandomValues(arr)
  return Array.from(arr, dec2hex).join('')
}

function get_key(pass, salt_s){
  var password = new buffer.SlowBuffer(pass.normalize('NFKC'));
  var salt = new buffer.SlowBuffer(salt_s.normalize('NFKC')); //SHOULD BE RANDOMIZED!!!

  var N = 16384, r = 8, p = 1;
  var dkLen = 16;

  scrypt(password, salt, N, r, p, dkLen, function(error, progress, key) {
        if (error) {
          //console.log("Error: " + error);
        } else if (key) {
          //console.log("Found: " + key);
          $( document ).trigger('keyFound', [key])
        } else {
          //console.log(progress);
          $( document ).trigger('keyProgess', [progress])
        }
  });
}

function perform_aes_enc(pltext, key){
  var text = pltext;
  var textBytes = aesjs.utils.utf8.toBytes(text);
  var aesCbc = new aesjs.ModeOfOperation.ctr(key);
  var encryptedBytes = aesCbc.encrypt(textBytes);
  var encryptedHex = aesjs.utils.hex.fromBytes(encryptedBytes);
  //console.log(encryptedHex);
  $( document ).trigger('encSucc', [encryptedHex]);
}

function perform_aes_dec(enctext, key){
  var encryptedBytes = aesjs.utils.hex.toBytes(enctext);
  var aesCtr = new aesjs.ModeOfOperation.ctr(key);
  var decryptedBytes = aesCtr.decrypt(encryptedBytes);
  var decryptedText = aesjs.utils.utf8.fromBytes(decryptedBytes);
  $( document ).trigger('decSucc', [decryptedText]);
}

function display_enc_res(salt, encHex){
  var enc_obj = {
    salt:salt,
    encHex:encHex
  };
  var eo_json = JSON.stringify(enc_obj);
  var eo_str = btoa(eo_json);

  var loc = window.location.href;
  var aurl = $.mobile.path.makeUrlAbsolute('dec.html', loc );

  var fin_str = aurl + '#' + eo_str

  $('#encLinkT').val(fin_str);
  $('#encLinkC').fadeIn();
}

function display_dec_res(decText){
  $('#decLinkT').val(decText);
  $('#decLinkC').fadeIn();
}

function encrypt_link(){
  var slt = generateId(50);
  var pwd = $('#inputPassword').val();


  $('#encLinkC').fadeOut();

  $('#keyProgess').css('width', '0%');
  $( document ).off('keyProgess');
  $( document ).on('keyProgess', (e, progress) => {
    var progress_str = Math.round(progress*100) + '%';
    $('#keyProgess').css('width', progress_str);
  })

  $( document ).one('keyFound', (evnt, key) =>{
    perform_aes_enc($('#inputLink').val(), key)
  });

  $( document ).one('encSucc', (evnt, encHex)=>{
    display_enc_res(slt, encHex);
  });

  get_key(pwd, slt);
}

function decrypt_link(){
  var eo_str = atob($('#inputEnc').val());
  var eo_obj = JSON.parse(eo_str);
  var slt = eo_obj.salt;
  var pwd = $('#inputPassword').val();

  $('#decLinkC').fadeOut();

  $('#keyProgess').css('width', '0%');
  $( document ).off('keyProgess');
  $( document ).on('keyProgess', (e, progress) => {
    var progress_str = Math.round(progress*100) + '%';
    $('#keyProgess').css('width', progress_str);
  })

  $( document ).one('keyFound', (evnt, key) =>{
    perform_aes_dec(eo_obj.encHex, key)
  });

  $( document ).one('decSucc', (evnt, decText)=>{
    display_dec_res(decText);
  });

  get_key(pwd, slt);
}

function paste_hash(){
  var hash = window.location.hash;
  if (hash !== ""){
    $('#inputEnc').val(hash.slice(1));
    $('#inputPassword').focus();
  }
}

function open_link(){
  var link = $('#decLinkT').val();
  var site = window.open("", "hide_referrer");
  site.document.open();
  site.document.writeln('<script type="text/javascript">window.location = "' + link + '";</script>');
  site.document.close();
  window.close();
}

function copy_link(){
  $('#encLinkT').select();
  document.execCommand("Copy");
}
