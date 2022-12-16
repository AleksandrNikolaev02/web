const rt = require("express");
const db = require("../models/db");

const router = rt.Router();

var list_files = [];
var link_file = '';
var grade = [];

router.get('/', async function(req, res){
    list_files = [];
    const query ='select link, count(comment) as cnt from files left join grades on files.link = grades.link_f group by link order by cnt asc limit 3;'
    const res_row = await db.query(query);
    for (let index = 0; index < res_row.rowCount; index++) {
        list_files.push(res_row.rows[index].link);
        
    };

    console.log(list_files);
    res.render('index');
})



router.get('/auth', function(req, res){
    res.cookie('name', 'guest');
    res.render('auth', {
        data: ''
    });
});

router.get('/signup', function(req, res){
    res.render('signup');
});

router.post('/usersignup', async function(req, res){
    const parse_result = JSON.parse(JSON.stringify(req.body));
    const res_row = await db.query('SELECT * FROM users');
    const query = 'INSERT INTO users(id, name, email, password) VALUES ($1, $2, $3, $4)';
    const result = await db.query(query, [res_row.rowCount + 1, parse_result.name, parse_result.email, parse_result.psw]);
    res.render('usersignup');
});

router.get('/userauth', async function(req, res){
    const name = req.get('cookie').replace('name=', '')
    list_files = [];
    const query ='select files.link, count(comment) as cnt from files left join grades on files.link = grades.link_f, (select link from user_files where user_n = $1) as test group by files.link, test.link having files.link <> test.link order by cnt asc limit 3;'
    const res_row = await db.query(query, [name]);
    for (let index = 0; index < res_row.rowCount; index++) {
        list_files.push(res_row.rows[index].link);
        
    };

    console.log(list_files);
    res.render('indexUser', {
        data: 'Добро пожаловать, ' + name + '!'
    });
});

router.post('/userauth', async function(req, res){
    const parse_result = JSON.parse(JSON.stringify(req.body));
    const res_row = await db.query('select name, password from users');
    let flag = false;
    for (let index = 0; index < res_row.rowCount; index++) {
        if(parse_result.name == res_row.rows[index].name && parse_result.psw == res_row.rows[index].password) {
            flag = true;
            break;
        }
        else {
            flag = false;
        }
    }
    console.log(flag)
    if(flag === true) {
        const name = 'Добро пажаловать, ' + parse_result.name + '!';
        console.log(name);
        res.cookie('name', parse_result.name);
        res.render('indexUser', {
            data: name
        });
        list_files = [];
        const query ='select files.link, count(comment) as cnt from files left join grades on files.link = grades.link_f, (select link from user_files where user_n <> $1) as test group by files.link, test.link having files.link != test.link order by cnt asc limit 3;'
        const res_row = await db.query(query, [parse_result.name]);
        for (let index = 0; index < res_row.rowCount; index++) {
            list_files.push(res_row.rows[index].link);
            
        };

    console.log(list_files);
    }
    else {
        res.render('auth', {
            data: 'Неправильное имя или пароль'
        })
    }

});

router.get('/allfiles', async function(req, res){
    const links = await db.query('select link from files');
    const grades = await db.query("select link, grade, comment from files left join grades on files.link = grades.link_f");
    data = [];
    comment = [];
    for (let index = 0; index < links.rowCount; index++) {
        data.push(links.rows[index].link);
        
    }
    for (let index = 0; index < grades.rowCount; index++) {
        comment.push(grades.rows[index])
        
    }
    console.log(comment);
    res.render('allFiles', {
        data: data,
        grades: comment
    });
});


router.get('/userauth/allfilesUser', async function(req, res){
    const name = req.get('cookie').replace('name=', '');
    const links = await db.query('select link from user_files where user_n = $1;', [name]);
    const grades = await db.query("select link, grade, comment from user_files left join grades on user_files.link = grades.link_f where user_n = $1", [name]);
    data = [];
    comment = [];
    for (let index = 0; index < links.rowCount; index++) {
        data.push(links.rows[index].link);
        
    }
    for (let index = 0; index < grades.rowCount; index++) {
        comment.push(grades.rows[index])
        
    }
    console.log(comment);
    res.render('allFiles', {
        data: data,
        grades: comment
    });
});

router.post('/upload', async function(req, res, next){
    const res_row = await db.query('SELECT * FROM files');
    if(!req.files) {
        res.render('errorUpload');
    }
    else {
        var file = req.files.data;
        const filename = file.name; 
        file.mv('./uploaded/' + res_row.rowCount+filename, function(err){
            if(err) {
                return res.status(500).send(err);
            }
            else {
                res.render('upload');
            }
        })
        console.log(__dirname + './uploaded/' + filename);
        const query = 'INSERT INTO files(id, link) VALUES ($1, $2)';
        const result = await db.query(query, [res_row.rowCount + 1, '../uploaded/' + res_row.rowCount +filename]);
    }
});

router.post('/userauth/upload', async function(req, res, next){
    const res_row = await db.query('SELECT * FROM files');
    let user = req.get('cookie').replace('name=', '')
    console.log(user)
    if(!req.files) {
        res.render('errorUploadUser');
    }
    else {
        var file = req.files.data;
        const filename = file.name; 
        file.mv('./uploaded/' + res_row.rowCount+filename, function(err){
            if(err) {
                return res.status(500).send(err);
            }
            else {
                res.render('uploadUser');
            }
        })
        console.log(__dirname + './uploaded/' + filename);
        const query1 = 'INSERT INTO user_files(link, user_n) VALUES ($1, $2)';
        const result1 = await db.query(query1, ['../uploaded/' + res_row.rowCount +filename, user]);
        const query2 = 'INSERT INTO files(id, link) VALUES ($1, $2)';
        const result2 = await db.query(query2, [res_row.rowCount + 1, '../uploaded/' + res_row.rowCount +filename]);
    }
});

router.get('/grade', function(req, res){
    res.render('grade');
});

router.get('/userauth/grade', function(req, res){
    res.render('gradeUser');
});

router.get('/grade/file1', async function(req, res){
    link_file = '';
    str = list_files[0];
    grade = [];
    const obj = JSON.stringify(str);
    src = obj.replace('{"link":', '').replace('}', '').replace('"', '').replace('"', ''); 
    link_file = src;
    result = await db.query("SELECT grade, comment FROM grades where link_f=$1", [src]);
    console.log(result.rows)
    res.render('file', {
        title:'Система оценки работ',
        src: src,
        data: result.rows
    });
});

router.get('/grade/file2', async function(req, res){
    link_file = '';
    str = list_files[1];
    grade = [];
    const obj = JSON.stringify(str);
    src = obj.replace('{"link":', '').replace('}', '').replace('"', '').replace('"', ''); 
    link_file = src;
    result = await db.query("SELECT grade, comment FROM grades where link_f=$1", [src]);
    console.log(result.rows)
    res.render('file', {
        title:'test',
        src: src,
        data: result.rows
    });
});

router.get('/grade/file3', async function(req, res){
    link_file = '';
    str = list_files[2];
    grade = [];
    const obj = JSON.stringify(str);
    src = obj.replace('{"link":', '').replace('}', '').replace('"', '').replace('"', ''); 
    link_file = src;
    result = await db.query("SELECT grade, comment FROM grades where link_f=$1", [src]);
    console.log(result.rows)
    res.render('file', {
        title:'test',
        src: src,
        data: result.rows
    });
});

router.post('/grade/file/submit', async function(req, res){ 
    
    parse_result = JSON.parse(JSON.stringify(req.body));
    const rating = parse_result.rating;
    const comment = parse_result.textComment;

    console.log(link_file);
    const query = 'INSERT INTO grades(link_f, grade, comment) VALUES ($1, $2, $3)';
    const result = await db.query(query, [link_file, rating, comment]);
    res.render('submit');
});

router.get('/:path([\\w\\W]+)', function(req, res){
    str = __dirname.replace('\\routes', '')
    res.sendFile(req.url, {root: str})
})

module.exports = router;