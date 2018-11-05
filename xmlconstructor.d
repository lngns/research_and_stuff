module xmlconstructor;

mixin template mixinXmlConstruct()
{
    import arsd.dom;
    import std.traits;

    auto xmlConstruct(string source)()
    {
        static class DClassEnumDelegate
        {
            XmlDocument doc;

            this()
            {
                doc = new XmlDocument(source);
            }
            const(XmlDocument) getDoc() const
            {
                return doc;
            }
        }
        //ok so we cannot store a class instance as a manifest constant with "enum"
        //and "static const" triggers an error with XmlDocument anyway
        //(arsd.dom is not compatible with it maybe?)
        //but there is a bug allowing delegates with class as contexts to be manifest constants!
        //so here you have it; Doc's context is a class. Also note the bug allows the function to mutates its context
        //so I marked getDoc() const for it not to be confusing.
        enum Doc = &(new DClassEnumDelegate().getDoc);

        static if(Doc().root.tagName == "d:template")
            mixin("alias typename = " ~ Doc().root.attributes["d:type"] ~ ";");
        else
            mixin("alias typename = " ~ Doc().root.tagName ~ ";");
        static if(is(typename == class))
            typename obj = new typename;
        else
            typename obj;

        static foreach(attr, value; Doc().root.attributes)
        {
            static if(hasMember!(typename, attr))
            {
                static if(is(typeof(__traits(getMember, obj, attr)) == string))
                {
                    static if(value[0..2] == "d{" && value[$-1] == '}')
                        mixin("obj." ~ attr ~ " = " ~ value[2..$-1] ~ ";");
                    else
                        mixin("obj." ~ attr ~ " = \"" ~ value ~ "\";");
                }
                else
                    mixin("obj." ~ attr ~ " = " ~ value ~ ";");
            }
        }
        static if(hasMember!(typename, "opXml") && isFunction!(typename.opXml) && is(ReturnType!(typeof(&typename.opXml)) == void))
        {
            enum length = Doc().root.childNodes.length;
            static foreach(i; 0..length)
            {
                static if(Doc().root.childNodes[i].tagName[0] != '#')
                {
                    obj.opXml(xmlConstruct!(Doc().root.childNodes[i].toString()));
                }
            }
        }

        return obj;
    }
}

