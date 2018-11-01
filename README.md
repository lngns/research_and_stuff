# Research Prototypes

This repository will contain various prototypes I wrote, mainly in JS, D, C and C++ as these are the languages I currently use.  
Everything here is public domain.

# ParaStack

**parastack.js** is a pretty simple stack language supporting basic operations (`4 5 + .` outputs 9, yay), but it is also **multithreaded**.  
The scheduling mechanism is the most simple thing I came up with: as the language is divided in multiple words (strings, numbers, code blocks and instructions), each thread has a `counter` field.
This field is incremented by the interpreter at each tick executing the thread. When it reaches 10, it is reset and a context switch happens.  
Plus, being too lazy to do otherwise, executing a block via the `call` instruction actually spawns a new thread for the block, pauses the caller and forces a context switch too.  
  
Therefore, the scheduling is pretty predictable, but I still thought having multi-threaded code in the web browser was cool.  
JavaScript does not have the necessary primitives to let context switches happen between two statements, though that could be emulated with continuations and manual yielding (or a JS interpreter written in JS :p).  
  
Only integer numbers are supported; binary, octal, decimal and hexadecimal are supported with the `0b`, `0o`, `0d` (optional) and `0x` prefixes respectively.  
Strings support basic C escape sequences.  
Booleans are there.  
Native JS code may be embedded between backticks `\``, pushing callable functions into the stack.  
Lastly, "code blocks" may be pushed on the stack: code between braces, stored as arrays, and executable.  

Here are the supported instructions with their required operands shown:  
`<string> print`, `<string> .` (alias for `print`), `<string> print_nopop` (prints without removing the last element),  
`dump` (prints the stack), `undefined` (default when no commands match),  
`<string> parse` (parses code and produces an AST),  
`<block|native|string> call` (executes a block, native code, or dispatch to a command from its name in a string),  
`<block|native> <string> addword` (registers a command),  
`<int> <int> add`, `<int> <int> +`, `<int> <int> mul`, `<int> <int> *`,  
`<int lhs> <int rhs> sub`, `<int lhs> <int rhs> -`, `<int lhs> <int rhs> div`, `<int lhs> <int rhs> /`,  
`<int lhs> <int rhs> mod`, `<int lhs> <int rhs> %`,  
`<int lhs> <int rhs> pow`, `<int lhs> <int rhs> **`, `<int> sqrt`,  
`<int> <int> bitand`, `<int> <int> &`, `<int> <int> bitxor`, `<int> <int> ^`, `<int> <int> bitor`, `<int> <int> |`,  
`<int lhs> <int rhs> lsh`, `<int lhs> <int rhs> <<`, `<int lhs> <int rhs> rsh`, `<int lhs> <int rhs> >>`,  
`true`, `false`,  
`<anything> pop`, `<anything> <anything> reverse`, `<anything> dup`,  
`<array> <index> get`, `<array> <index> <value> set`,  
`<cond> <then> <otherwise> if`,  
`<test> <body> while` (the loop condition is the last pushed object on the stack, after each iteration)  
  
Threading commands:  
- `<block> spawn` spawns a new thread and pushes its id on the parent stack  
- `getid` pushes the thread id of the current thread  
- `<id> waitid` joins the current thread with the one of id  
- `yield` forces a context switch  
- `die` suicides the current thread

Basic primitives to manipulate a block's code:  
- `<block> <index> get_inst` pushes the literal word from a block's index; `{4 5 +} 2 get_inst .` => `+`  
- `<block> <index> <value> set_inst` alters a block; `{15 10 +} 2 "-" set_inst call .` => `5`  

Other stuff to do may be: shared variables, atomicity, messaging, a proper scheduling _for_ JS.

# xmlConstruct

**xmlconstruct.d** is a D factory constructing objects from a XML document.  
It is 100% compile-time as it uses D reflection, and requires `arsd.dom`[1].  
The pattern is based on Skew's approach to XML construction[2], with XML attributes initializing fields, and child nodes being constructed and passed to `opXml` (following D style instead of Skew <>...</>).

As such, one can do this:
```d
import xmlconstructor;
mixin mixinXmlConstructor;

struct Foo
{
private:
    Baz[] elems;

public:
    int val;
    
    void opXml(Baz elem)
    {
        elems ~= elem;
    }
}
struct Baz
{
    string name;
}

int main()
{
    auto obj = xmlConstruct!q{
        <Foo val="42">
            <Baz name="Moskva" />
            <Baz name="Copenhagen" />
        </Foo>
    };
    return 1;
}
```


[1] https://github.com/adamdruppe/arsd
[2] http://skew-lang.org/