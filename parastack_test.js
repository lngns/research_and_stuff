try
{
    execute(
        '{dup .} ".." addword \n' +
        '"start" . \n' +
        '{5 .. .. .. .. .. .. .. .. .. .. .. .. .. .. .. .. .. ..} spawn \n' +
        '7 .. .. .. .. .. .. .. .. .. .. .. .. .. .. .. ..\n' +
        '\n' +
        '"pid: " . getid .\n' +
        '{"pid: " . getid .} call\n' +
        '{"pid: " . getid .} spawn\n' +
        '"pid: " . getid .\n' +
        '\n' +
        '-0b10 . yield\n' +
        '{getid . "a" . yield "b" . yield "c" . yield} spawn .. waitid "d" .'
    );
}
catch(ex)
{
    console.log(ex);
}

