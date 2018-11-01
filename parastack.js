function execute(code)
{
    const T_INSTRUCTION = 0;
    const T_NUMBER = 1;
    const T_STRING = 2;
    const T_ARRAY = 3; //todo
    const T_BLOCK = 4;
    const T_NATIVE = 5;
    
    function parse(code)
    {
        let i, line = 1, column = 0, startColumn = 0, words = [];
        
        function eatSubScript(delimiter, canEscape = false)
        {
            let buffer = "";
            for(++i; i < code.length; ++i)
            {
                if(code[i] === delimiter && (!canEscape || code[i-1] !== '\\'))
                    break;
                buffer += code[i];
            }
            return buffer;
        }
        function eatString()
        {
            let buffer = "";
            for(++i; i < code.length; ++i)
            {
                if(code[i] === '"')
                    break;
                else if(code[i] === '\\' && i !== code.length - 1)
                {
                    switch(code[++i])
                    {
                    case '"': buffer += '"'; break;
                    case 'a': buffer += '\a'; break;
                    case 'b': buffer += '\b'; break;
                    case 'f': buffer += '\f'; break;
                    case 'n': buffer += '\n'; break;
                    case 'r': buffer += '\r'; break;
                    case 't': buffer += '\t'; break;
                    case 'v': buffer += '\v'; break;
                    case '\\': buffer += '\\'; break;
                    case '\'': buffer += '\''; break;
                    case '?': buffer += '\?'; break;
                    case 'e': buffer += '\e'; break;
                    case '0': buffer += '\0'; break;
                    default: buffer += '\\' + code[i]; break;
                    }
                }
                else
                    buffer += code[i];
            }
            return buffer;
        }
        function eatNative()
        {
            return eatSubScript('`', true);
        }
        function eatBlock()
        {
            return parse(eatSubScript('}'));
        }
        function eatNumber()
        {
            let negative = false;
            let buffer = "";
            let radix = 10;
            for(; i < code.length && code[i] !== ' ' && code[i] !== '\n'; ++i)
                buffer += code[i];
            if(buffer[0] === '-')
                negative = true;
            if(buffer.length > 2 && buffer[0] === '0' || negative && buffer.length > 3 && buffer[1] === '0')
            {
                switch(negative ? buffer[2] : buffer[1])
                {
                case 'b': radix = 2; break;
                case 'o': radix = 8; break;
                case 'd': radix = 10; break;
                case 'x': radix = 16; break;
                default: throw "Unrecognized Word: `" + buffer + "` at " + line + ":" + column;
                }
                buffer = negative ? '-' + buffer.slice(3) : buffer.slice(2);
            }
            return parseInt(buffer, radix);
        }
        function eatInstruction()
        {
            let buffer = "";
            for(; i < code.length && code[i] !== ' ' && code[i] !== '\n'; ++i)
                buffer += code[i];
            return buffer;
        }
        
        for(i = 0; i < code.length; ++i)
        {
            column = i - startColumn;
            if(code[i] === ' ')
                continue;
            else if(code[i] === '\n')
            {
                startColumn = i;
                ++line;
                continue;
            }
            else if(code[i] === '"')
                words.push({type: T_STRING, value: eatString(), line: line, column: column});
            else if(/[0-9\-]/.test(code[i]))
                words.push({type: T_NUMBER, value: eatNumber(), line: line, column: column});
            else if(code[i] === '`')
                words.push({type: T_NATIVE, value: eatNative(), line: line, column: column});
            else if(code[i] === '{')
                words.push({type: T_BLOCK, value: eatBlock(), line: line, column: column});
            else
                words.push({type: T_INSTRUCTION, value: eatInstruction(), line: line, column: column});
            
            if(code[i] === '\n')
            {
                startColumn = i;
                ++line;
                continue;
            }
        }
        return words;
    }
    
    
    let threads = [];
    let current_pid = 0;
    const STATE_RUNNING = 0;
    const STATE_WAITING = 1;
    const STATE_FINISHED = 2;
    let yieldFlag = false;
    
    let instructions = {
        print: s => console.log(s.pop()),
        print_nopop: s => console.log(s[s.length-1]),
        dump: s => { console.log(s); alert(s); },
        "undefined": (s, d) => { throw {message: "Unknown Instruction: `" + s.pop() + "` at " + d.line + ":" + d.column, states: threads}; },
        call: (s, d, t) => call(s.pop(), s, d, t),
        parse: s => s.push(parse(s.pop())),
        addword: s => instructions[s.pop()] = s.pop(),
        add: s => s.push(s.pop() + s.pop()),
        mul: s => s.push(s.pop() * s.pop()),
        sub: s => { const n = s.pop(); s.push(s.pop() - n); },
        div: s => { const n = s.pop(); s.push(s.pop() / n); },
        mod: s => { const n = s.pop(); s.push(s.pop() % n); },
        pow: s => { const n = s.pop(); s.push(Math.pow(s.pop(), n)); },
        sqrt: s => { s.push(Math.sqrt(s.pop())); },
        bitand: s => s.push(s.pop() & s.pop()),
        bitxor: s => s.push(s.pop() ^ s.pop()),
        bitor: s => s.push(s.pop() | s.pop()),
        lsh: s => { const n = s.pop(); s.push(s.pop() << n); },
        rsh: s => { const n = s.pop(); s.push(s.pop() >> n); },
        "true": s => s.push(true),
        "false": s => s.push(false),
        pop: s => s.pop(),
        reverse: s => { s.push(s.pop(), s.pop()); },
        dup: s => { const temp = s.pop(); s.push(temp); s.push(temp); },
        get: s => { const idx = s.pop(); s.push(s.pop()[idx]); },
        set: s => { const val = s.pop(); const idx = s.pop(); s[s.length-1][idx] = val; },
        get_inst: s => { const idx = s.pop(); s.push(s.pop()[idx].value); },
        set_inst: s => { const val = s.pop(); const idx = s.pop(); s[s.length-1][idx].value = val; },
        "if": (s, d, t) => {
            const otherwise = s.pop();
            const then = s.pop();
            const cond = s.pop();
            if(cond === true || cond !== 0)
                callOrPush(then, s, d, t);
            else
                callOrPush(otherwise, s, d, t);
        },
        "while": (s, d, t) => {
            const body = s.pop();
            let test;
            while(true)
            {
                test = s.pop();
                if(test === false || test === 0)
                    break;
                callOrPush(body, s, d, t);
            }
        },
        spawn: (s, d, t) => {
            const id = generateThreadId();
            threads.push({
                words: s.pop(),
                stack: JSON.parse(JSON.stringify(s)),
                id: id,
                ip: 0,
                counter: 0,
                state: STATE_RUNNING,
                queue: []
            });
            s.push(id);
        },
        getid: (s, d, t) => s.push(t.id),
        waitid: (s, d, t) => {
            getThreadFromId(s.pop()).queue.push(t);
            t.state = STATE_WAITING;
            yieldFlag = true;
        },
        yield: s => yieldFlag = true,
        die: (s, d, t) => {
            t.state = STATE_FINISHED;
            yieldFlag = true;
        }
    };
    instructions["."] = instructions.print;
    //instructions[".."] = instructions.print_nopop;
    instructions["+"] = instructions.add;
    instructions["*"] = instructions.mul;
    instructions["-"] = instructions.sub;
    instructions["/"] = instructions.div;
    instructions["%"] = instructions.mod;
    instructions["**"] = instructions.pow;
    instructions["&"] = instructions.bitand;
    instructions["^"] = instructions.bitxor;
    instructions["|"] = instructions.bitor;
    instructions["<<"] = instructions.lsh;
    instructions[">>"] = instructions.rsh;
    
    function call(target, stack, details, thread)
    {
        if(Array.isArray(target))
            forkAndExec(target, stack, thread);
        else if(typeof target === "function")
            target(stack, details, thread);
        else if(typeof target === "string")
        {
            if(target in instructions)
                call(instructions[target], stack, details, thread);
            else
            {
                stack.push(target);
                instructions.undefined(stack, details, thread);
            }
        }
        else
            throw {message: "Cannot call value at " + details.line + ":" + details.column, states: threads};
    }
    function callOrPush(target, stack, details, thread)
    {
        if(Array.isArray(target))
            forkAndExec(target, stack, thread);
        else if(typeof target === "function")
            target(stack, details);
        else
            stack.push(target);
    }
    function forkAndExec(source, stack, parent)
    {
        threads.push({words: source, stack: stack, id: generateThreadId(), ip: 0, counter: 0, state: STATE_RUNNING, queue: [parent]});
        parent.state = STATE_WAITING;
        yieldFlag = true; //forces context switch
    }
    
    
    function interpret(thread_state)
    {
        for(; thread_state.ip < thread_state.words.length; ++thread_state.ip, ++thread_state.counter)
        {
            if(thread_state.counter === 10)
            {
                thread_state.counter = 0;
                return;
            }
            if(yieldFlag)
            {
                yieldFlag = false;
                return;
            }
            
            const word = thread_state.words[thread_state.ip]; //console.log(word);
            switch(word.type)
            {
            case T_INSTRUCTION:
                call(word.value, thread_state.stack, word, thread_state);
                break;
            case T_NUMBER:
            case T_STRING:
            case T_BLOCK:
                thread_state.stack.push(word.value);
                break;
            case T_NATIVE:
                thread_state.stack.push((_stack, _word, _thread) => eval(word.value));
                break;
            }
        }
        thread_state.state = STATE_FINISHED;
    }
    function switchContext(count = 0)
    {
        if(threads.length === 0) //all threads have finished
            return;
        if(count === threads.length) //all threads are waiting
            throw {message: "Deadlock reached. All threads are waiting.", states: threads};
        if(++current_pid >= threads.length)
            current_pid = 0;
        if(threads[current_pid].state === STATE_WAITING)
            switchContext(++count);
    }
    function getThreadFromId(id, retNull = false)
    {
        for(let i = 0; i < threads.length; ++i)
        {
            if(threads[i].id === id)
                return threads[i];
        }
        if(retNull)
            return null;
        else
            throw {message: "No threads with id " + id, states: threads};
    }
    function generateThreadId()
    {
        let id = threads.length;
        while(getThreadFromId(id, true) !== null)
            ++id;
        return id;
    }
    
    threads.push({words: parse(code), stack: [], id: 0, ip: 0, counter: 0, state: STATE_RUNNING, queue: []});
    while(threads.length !== 0)
    {
        interpret(threads[current_pid]);
        if(threads[current_pid].state === STATE_FINISHED)
        {
            for(let i = 0; i < threads[current_pid].queue.length; ++i)
                threads[current_pid].queue[i].state = STATE_RUNNING; //waking up the waiting threads
            threads.splice(current_pid, 1);
        }
        switchContext();
    }
}

